import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  EthAddress,
  PublicCollections,
  Transaction,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import { TransactionRepository } from '@build-5/lib';
import { Observable } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class OrderApi extends BaseApi<Transaction> {
  private transactionRepo = new TransactionRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.TRANSACTION, httpClient);
  }

  public orderNft = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.orderNft, req);

  public orderToken = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.orderToken, req);

  public validateAddress = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.validateAddress, req);

  public openBid = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.openBid, req);

  public listenMultiple = (ids: EthAddress[]) =>
    this.transactionRepo.getByFieldLive(
      ids.map(() => 'uid'),
      ids,
    );
}
