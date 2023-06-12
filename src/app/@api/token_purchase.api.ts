import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  PublicCollections,
  TokenPurchase,
  TokenPurchaseAge,
  TokenTradeOrder,
  TokenTradeOrderType,
} from '@build-5/interfaces';
import { TokenPurchaseRepository, TokenStatsRepository } from '@build-5/lib';
import { map } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

const TRADE_HISTORY_SIZE = 100;

@Injectable({
  providedIn: 'root',
})
export class TokenPurchaseApi extends BaseApi<TokenPurchase> {
  private tokenStatRepo = new TokenStatsRepository(SOON_ENV);
  private tokenPurchaseRepo = new TokenPurchaseRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.TOKEN_PURCHASE, httpClient);
  }

  public listenVolume7d = (tokenId: string) =>
    this.tokenStatRepo
      .getByIdLive(tokenId, tokenId)
      .pipe(map((stats) => (stats?.volume || {})[TokenPurchaseAge.IN_7_D] || 0));

  public listenVolume24h = (tokenId: string) =>
    this.tokenStatRepo
      .getByIdLive(tokenId, tokenId)
      .pipe(map((stats) => (stats?.volume || {})[TokenPurchaseAge.IN_24_H] || 0));

  public listenAvgPrice7d = (tokenId: string) => this.tokenPurchaseRepo.getAvgPriceLive(tokenId);

  public listenChangePrice24h = (tokenId: string) =>
    this.tokenPurchaseRepo.getPriceChangeLive(tokenId);

  public listenToPurchases = (tokenId: string, lastValue?: string) =>
    this.tokenPurchaseRepo.getPuchasesLive(tokenId, lastValue);

  public getPurchasesForTrade = (tradeOrder: TokenTradeOrder, lastValue?: string) =>
    this.tokenPurchaseRepo.getByFieldLive(
      tradeOrder.type === TokenTradeOrderType.BUY ? 'buy' : 'sell',
      tradeOrder.uid,
      lastValue,
    );
}
