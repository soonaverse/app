import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Member,
  Network,
  Nft,
  PublicCollections,
  Transaction,
  TransactionOrder,
  TransactionOrderType,
  TransactionPayment,
  TransactionType,
  WEN_FUNC,
  WenRequest,
} from '@soonaverse/interfaces';
import { MemberRepository, NftRepository, TransactionRepository } from '@soonaverse/lib';
import { Observable, switchMap } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

export interface SuccesfullOrdersWithFullHistory {
  newMember: Member;
  order: TransactionOrder;
  transactions: Transaction[];
}

export interface OffersHistory {
  member: Member;
  transaction: TransactionPayment;
}

@Injectable({
  providedIn: 'root',
})
export class NftApi extends BaseApi<Nft> {
  private transactionRepo = new TransactionRepository(SOON_ENV);
  private memberRepo = new MemberRepository(SOON_ENV);
  private nftRepo = new NftRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.NFT, httpClient);
  }

  public create = (req: WenRequest): Observable<Nft | undefined> =>
    this.request(WEN_FUNC.createNft, req);

  public batchCreate = (req: WenRequest): Observable<string[] | undefined> =>
    this.request(WEN_FUNC.createBatchNft, req);

  public setForSaleNft = (req: WenRequest): Observable<Nft | undefined> =>
    this.request(WEN_FUNC.setForSaleNft, req);

  public withdrawNft = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.withdrawNft, req);

  public depositNft = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.depositNft, req);

  public stakeNft = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.stakeNft, req);

  public successfullOrders(
    nftId: string,
    network?: Network,
    lastValue?: string,
  ): Observable<SuccesfullOrdersWithFullHistory[]> {
    const fieldNames = ['payload.nft', 'type', 'payload.royalty'];
    const fieldValues = [nftId, TransactionType.BILL_PAYMENT, false];
    if (network) {
      fieldNames.push('network');
      fieldValues.push(network);
    }
    return this.transactionRepo.getByFieldLive(fieldNames, fieldValues, lastValue).pipe(
      switchMap(async (transactions) => {
        const out: SuccesfullOrdersWithFullHistory[] = [];
        for (const transaction of transactions) {
          const sourceTransactions = transaction.payload.sourceTransaction;
          const sourceTransaction = Array.isArray(sourceTransactions)
            ? sourceTransactions[sourceTransactions.length - 1]
            : sourceTransactions;
          const order = (await this.transactionRepo.getById(sourceTransaction))!;
          const member = (await this.memberRepo.getById(transaction.member!))!;

          const successfullOrder: SuccesfullOrdersWithFullHistory = {
            newMember: member!,
            order,
            transactions: [],
          };

          for (const link of order.linkedTransactions) {
            const linkedTransaction = (await this.transactionRepo.getById(link))!;
            if (
              (!linkedTransaction.payload.void && !linkedTransaction.payload.invalidPayment) ||
              linkedTransaction.type === TransactionType.BILL_PAYMENT
            ) {
              successfullOrder.transactions.push(linkedTransaction);
              // Make sure order price is ovewriten with payment price.
              // During bidding this can be different to what it was initially. Date should also be when it was paid.
              if (linkedTransaction.type === TransactionType.PAYMENT) {
                order.payload.amount = linkedTransaction.payload.amount;
                order.createdOn = linkedTransaction.createdOn;
              }
            }
          }
          successfullOrder.transactions.sort(
            (a, b) => b.createdOn!.toMillis() - a.createdOn!.toMillis(),
          );
          out.push(successfullOrder);
        }
        out.sort((a, b) => b.order.createdOn!.toMillis() - a.order.createdOn!.toMillis());

        return out;
      }),
    );
  }

  public getOffers(nft: Nft, lastValue?: string): Observable<OffersHistory[]> {
    return this.transactionRepo.getNftOffersLive(nft, lastValue).pipe(
      switchMap(async (transactions) => {
        const promises = transactions.map(async (transaction) => {
          const member = (await this.memberRepo.getById(transaction.member!))!;
          return { member, transaction } as OffersHistory;
        });
        return (await Promise.all(promises)).sort(
          (a, b) => b.transaction.payload.amount - a.transaction.payload.amount,
        );
      }),
    );
  }

  public getMembersBids = (member: Member, nft: Nft, currentAuction = false, lastValue?: string) =>
    this.transactionRepo.getMembersBidsLive(member.uid, nft, currentAuction, lastValue).pipe(
      switchMap(async (transactions) => {
        const promises = transactions.map(async (transaction) => {
          let sourceTransactions = transaction.payload.sourceTransaction;
          let sourceTransactionId = Array.isArray(sourceTransactions)
            ? sourceTransactions[sourceTransactions.length - 1]
            : sourceTransactions;
          let sourceTransaction = (await this.transactionRepo.getById(sourceTransactionId))!;

          if (sourceTransaction.type === TransactionType.PAYMENT) {
            sourceTransactions = sourceTransaction.payload.sourceTransaction;
            sourceTransactionId = Array.isArray(sourceTransactions)
              ? sourceTransactions[sourceTransactions.length - 1]
              : sourceTransactions;
            sourceTransaction = (await this.transactionRepo.getById(sourceTransactionId))!;
          }
          const isNftBid = sourceTransaction.payload.type === TransactionOrderType.NFT_BID;
          return isNftBid ? transaction : undefined;
        });

        return (await Promise.all(promises))
          .filter((r) => !!r)
          .map((r) => r!)
          .sort((a, b) => b!.createdOn!.toMillis() - a!.createdOn!.toMillis());
      }),
    );

  public lastCollection = (collection: string, lastValue?: string) =>
    this.nftRepo.getByCollectionLive(collection, ['createdOn'], ['asc'], lastValue);

  public positionInCollection = (collection: string, lastValue?: string) =>
    this.nftRepo.getByCollectionLive(collection, ['position'], ['asc'], lastValue);

  public topMember = (member: string, lastValue?: string) =>
    this.nftRepo.getByOwnerLive(member, lastValue);
}
