import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { PublicCollections, Ticker } from '@build-5/interfaces';
import { TickerRepository } from '@build-5/lib';
import { BaseApi, SOON_ENV } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TickerApi extends BaseApi<Ticker> {
  private tickerRepo = new TickerRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.TICKER, httpClient);
  }

  public listen = (id: string) => this.tickerRepo.getByIdLive(id);
}
