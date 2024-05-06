import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  NetworkAddress,
  Dataset,
  Transaction,
  WEN_FUNC,
  BuildcoreRequest,
  NftPurchaseRequest,
  NftPurchaseBulkRequest,
  OrderTokenRequest,
  AddressValidationRequest,
  NftBidRequest,
} from '@buildcore/interfaces';
import { Observable, of } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class OrderApi extends BaseApi<Transaction> {
  private transactionDataset = this.project.dataset(Dataset.TRANSACTION);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.TRANSACTION, httpClient);
  }

  public orderNft = (req: BuildcoreRequest<NftPurchaseRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.orderNft, req);

  public orderNfts = (
    req: BuildcoreRequest<NftPurchaseBulkRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.orderNftBulk, req);

  public orderToken = (
    req: BuildcoreRequest<OrderTokenRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.orderToken, req);

  public validateAddress = (
    req: BuildcoreRequest<AddressValidationRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.validateAddress, req);

  public openBid = (req: BuildcoreRequest<NftBidRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.openBid, req);

  public listenMultiple = (ids: NetworkAddress[]) =>
    ids.length
      ? this.transactionDataset.getByFieldLive(
          ids.map(() => 'uid'),
          ids,
        )
      : of([]);
}
