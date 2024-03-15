import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Member,
  Network,
  Nft,
  Dataset,
  Transaction,
  TransactionPayloadType,
  TransactionType,
  WEN_FUNC,
  Build5Request,
  NftCreateRequest,
  NftSetForSaleRequest,
  NftWithdrawRequest,
  NftDepositRequest,
  NftStakeRequest,
  NftTransferRequest,
} from '@build-5/interfaces';
import { Observable, switchMap } from 'rxjs';
import { BaseApi } from './base.api';

export interface SuccesfullOrdersWithFullHistory {
  newMember: Member;
  order: Transaction;
  transactions: Transaction[];
}

export interface OffersHistory {
  member: Member;
  transaction: Transaction;
}

@Injectable({
  providedIn: 'root',
})
export class NftApi extends BaseApi<Nft> {
  protected transactionDataset = this.project.dataset(Dataset.TRANSACTION);
  protected memberDataset = this.project.dataset(Dataset.MEMBER);
  protected nftDataset = this.project.dataset(Dataset.NFT);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.NFT, httpClient);
  }

  public create = (req: Build5Request<NftCreateRequest>): Observable<Nft | undefined> =>
    this.request(WEN_FUNC.createNft, req);

  public batchCreate = (req: Build5Request<NftCreateRequest[]>): Observable<string[] | undefined> =>
    this.request(WEN_FUNC.createBatchNft, req);

  public setForSaleNft = (req: Build5Request<NftSetForSaleRequest>): Observable<Nft | undefined> =>
    this.request(WEN_FUNC.setForSaleNft, req);

  public withdrawNft = (
    req: Build5Request<NftWithdrawRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.withdrawNft, req);

  public depositNft = (
    req: Build5Request<NftDepositRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.depositNft, req);

  public stakeNft = (req: Build5Request<NftStakeRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.stakeNft, req);

  public getNftById(nftId: string): Observable<Nft | undefined> {
    return this.listen(nftId);
  }

  public transferNft = (
    req: Build5Request<NftTransferRequest>,
  ): Observable<{ [key: string]: number } | undefined> => this.request(WEN_FUNC.nftTransfer, req);

  public getNftById(nftId: string): Observable<Nft | undefined> {
    return this.listen(nftId);
  }

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
    return this.transactionDataset.getByFieldLive(fieldNames, fieldValues, lastValue).pipe(
      switchMap(async (transactions) => {
        const out: SuccesfullOrdersWithFullHistory[] = [];
        for (const transaction of transactions) {
          const sourceTransactions = transaction.payload.sourceTransaction;
          const sourceTransaction = Array.isArray(sourceTransactions)
            ? sourceTransactions[sourceTransactions.length - 1]
            : sourceTransactions;
          const order = (await this.transactionDataset.id(sourceTransaction!).get())!;
          const member = (await this.memberDataset.id(transaction.member!).get())!;

          const successfullOrder: SuccesfullOrdersWithFullHistory = {
            newMember: member!,
            order,
            transactions: [],
          };

          for (const link of order.linkedTransactions!) {
            const linkedTransaction = (await this.transactionDataset.id(link).get())!;
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
    return this.transactionDataset.getNftOffersLive(nft, lastValue).pipe(
      switchMap(async (transactions) => {
        const promises = transactions.map(async (transaction) => {
          const member = (await this.memberDataset.id(transaction.member!).get())!;
          return { member, transaction } as OffersHistory;
        });
        return (await Promise.all(promises)).sort(
          (a, b) => Number(b.transaction.payload.amount) - Number(a.transaction.payload.amount),
        );
      }),
    );
  }

  public getMembersBids = (member: Member, nft: Nft, currentAuction = false, lastValue?: string) =>
    this.transactionDataset.getMembersBidsLive(member.uid, nft, currentAuction, lastValue).pipe(
      switchMap(async (transactions) => {
        const promises = transactions.map(async (transaction) => {
          let sourceTransactions = transaction.payload.sourceTransaction;
          let sourceTransactionId = Array.isArray(sourceTransactions)
            ? sourceTransactions[sourceTransactions.length - 1]
            : sourceTransactions;
          let sourceTransaction = (await this.transactionDataset.id(sourceTransactionId!).get())!;

          if (sourceTransaction.type === TransactionType.PAYMENT) {
            sourceTransactions = sourceTransaction.payload.sourceTransaction;
            sourceTransactionId = Array.isArray(sourceTransactions)
              ? sourceTransactions[sourceTransactions.length - 1]
              : sourceTransactions;
            sourceTransaction = (await this.transactionDataset.id(sourceTransactionId!).get())!;
          }
          const isNftBid = sourceTransaction.payload.type === TransactionPayloadType.NFT_BID;
          return isNftBid ? transaction : undefined;
        });

        return (await Promise.all(promises))
          .filter((r) => !!r)
          .map((r) => r!)
          .sort((a, b) => b!.createdOn!.toMillis() - a!.createdOn!.toMillis());
      }),
    );

  public lastCollection = (collection: string, lastValue?: string) =>
    this.nftDataset.getByCollectionLive(collection, ['createdOn'], ['asc'], lastValue);

  public positionInCollection = (collection: string, lastValue?: string) =>
    this.nftDataset.getByCollectionLive(collection, ['position'], ['asc'], lastValue);

  public topMember = (member: string, lastValue?: string) =>
    this.nftDataset.getByOwnerLive(member, lastValue);
}
