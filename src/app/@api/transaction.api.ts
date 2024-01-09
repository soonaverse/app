import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  Transaction,
  WEN_FUNC,
  Build5Request,
  CreditUnrefundableRequest,
} from '@build-5/interfaces';
import { Observable } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TransactionApi extends BaseApi<Transaction> {
  constructor(protected httpClient: HttpClient) {
    super(Dataset.TRANSACTION, httpClient);
  }

  public creditUnrefundable = (
    req: Build5Request<CreditUnrefundableRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.creditUnrefundable, req);
}
