import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  Subset,
  TokenPurchase,
  TokenPurchaseAge,
  TokenTradeOrder,
  TokenTradeOrderType,
} from '@buildcore/interfaces';
import { map } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenPurchaseApi extends BaseApi<TokenPurchase> {
  private tokenDataset = this.project.dataset(Dataset.TOKEN);
  private tokenPurchaseDataset = this.project.dataset(Dataset.TOKEN_PURCHASE);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.TOKEN_PURCHASE, httpClient);
  }

  public listenVolume7d = (tokenId: string) =>
    this.tokenDataset
      .id(tokenId)
      .subset(Subset.STATS)
      .subsetId(tokenId)
      .getLive()
      .pipe(map((stats) => (stats?.volume || {})[TokenPurchaseAge.IN_7_D] || 0));

  public listenVolume24h = (tokenId: string) =>
    this.tokenDataset
      .id(tokenId)
      .subset(Subset.STATS)
      .subsetId(tokenId)
      .getLive()
      .pipe(map((stats) => (stats?.volume || {})[TokenPurchaseAge.IN_24_H] || 0));

  public listenAvgPrice7d = (tokenId: string) => this.tokenPurchaseDataset.getAvgPriceLive(tokenId);

  public listenChangePrice24h = (tokenId: string) =>
    this.tokenPurchaseDataset.getPriceChangeLive(tokenId);

  public listenToPurchases = (tokenId: string, lastValue?: string) =>
    this.tokenPurchaseDataset.getPuchasesLive(tokenId, lastValue);

  public getPurchasesForTrade = (tradeOrder: TokenTradeOrder, lastValue?: string) =>
    this.tokenPurchaseDataset.getByFieldLive(
      tradeOrder.type === TokenTradeOrderType.BUY ? 'buy' : 'sell',
      tradeOrder.uid,
      lastValue,
    );
}
