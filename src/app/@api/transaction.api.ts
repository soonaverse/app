import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PublicCollections, Transaction, WEN_FUNC, WenRequest } from '@soonaverse/interfaces';
import { Observable } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TransactionApi extends BaseApi<Transaction> {
  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.TRANSACTION, httpClient);
  }

  public creditUnrefundable = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.creditUnrefundable, req);
}
