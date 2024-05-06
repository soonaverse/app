import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  TokenTradeOrder,
  TokenTradeOrderStatus,
  TokenTradeOrderType,
  WEN_FUNC,
  BuildcoreRequest,
  TradeTokenRequest,
  CancelTokenTradeOrderRequest,
} from '@buildcore/interfaces';
import { Observable, map } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenMarketApi extends BaseApi<TokenTradeOrder> {
  private tokenMarketDataset = this.project.dataset(Dataset.TOKEN_MARKET);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.TOKEN_MARKET, httpClient);
  }

  public bidsActive = (token: string, lastValue?: string) =>
    this.tokenMarketDataset.getBidsLive(
      token,
      TokenTradeOrderType.BUY,
      TokenTradeOrderStatus.ACTIVE,
      lastValue,
    );

  public asksActive = (token: string, lastValue?: string) =>
    this.tokenMarketDataset.getBidsLive(
      token,
      TokenTradeOrderType.SELL,
      TokenTradeOrderStatus.ACTIVE,
      lastValue,
    );

  public membersBids = (member: string, token: string, lastValue?: string) =>
    this.tokenMarketDataset.getMemberBidsLive(token, member, TokenTradeOrderType.BUY, lastValue);

  public membersAsks = (member: string, token: string, lastValue?: string) =>
    this.tokenMarketDataset.getMemberBidsLive(token, member, TokenTradeOrderType.SELL, lastValue);

  public listenAvgPrice = (tokenId: string) =>
    this.tokenMarketDataset.getTokenPriceLive(tokenId).pipe(map((result) => result.price));

  public tradeToken = (
    req: BuildcoreRequest<TradeTokenRequest>,
  ): Observable<TokenTradeOrder | undefined> => this.request(WEN_FUNC.tradeToken, req);

  public cancel = (
    req: BuildcoreRequest<CancelTokenTradeOrderRequest>,
  ): Observable<TokenTradeOrder | undefined> => this.request(WEN_FUNC.cancelTradeOrder, req);
}
