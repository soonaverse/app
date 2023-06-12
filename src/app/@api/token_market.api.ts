import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  PublicCollections,
  TokenTradeOrder,
  TokenTradeOrderStatus,
  TokenTradeOrderType,
  WEN_FUNC,
  WenRequest,
} from '@soonaverse/interfaces';
import { TokenMarketRepository } from '@soonaverse/lib';
import { Observable, map } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenMarketApi extends BaseApi<TokenTradeOrder> {
  private tokenMarketRepo = new TokenMarketRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.TOKEN_MARKET, httpClient);
  }

  public bidsActive = (token: string, lastValue?: string) =>
    this.tokenMarketRepo.getBidsLive(
      token,
      TokenTradeOrderType.BUY,
      TokenTradeOrderStatus.ACTIVE,
      lastValue,
    );

  public asksActive = (token: string, lastValue?: string) =>
    this.tokenMarketRepo.getBidsLive(
      token,
      TokenTradeOrderType.SELL,
      TokenTradeOrderStatus.ACTIVE,
      lastValue,
    );

  public membersBids = (member: string, token: string, lastValue?: string) =>
    this.tokenMarketRepo.getMemberBidsLive(token, member, TokenTradeOrderType.BUY, lastValue);

  public membersAsks = (member: string, token: string, lastValue?: string) =>
    this.tokenMarketRepo.getMemberBidsLive(token, member, TokenTradeOrderType.SELL, lastValue);

  public listenAvgPrice = (tokenId: string) =>
    this.tokenMarketRepo.getTokenPriceLive(tokenId).pipe(map((result) => result.price));

  public tradeToken = (req: WenRequest): Observable<TokenTradeOrder | undefined> =>
    this.request(WEN_FUNC.tradeToken, req);

  public cancel = (req: WenRequest): Observable<TokenTradeOrder | undefined> =>
    this.request(WEN_FUNC.cancelTradeOrder, req);
}
