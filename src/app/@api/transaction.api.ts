import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  Transaction,
  WEN_FUNC,
  BuildcoreRequest,
  CreditUnrefundableRequest,
} from '@buildcore/interfaces';
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
    req: BuildcoreRequest<CreditUnrefundableRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.creditUnrefundable, req);
}
