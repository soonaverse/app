import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Dataset, Ticker } from '@buildcore/interfaces';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TickerApi extends BaseApi<Ticker> {
  constructor(protected httpClient: HttpClient) {
    super(Dataset.TICKER, httpClient);
  }
}
