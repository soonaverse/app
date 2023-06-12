import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  PublicCollections,
  Token,
  TokenDistribution,
  Transaction,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import {
  TokenDistributionRepository,
  TokenRepository,
  TokenStatsRepository,
} from '@build-5/lib';
import { Observable, of } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenApi extends BaseApi<Token> {
  private tokenRepo = new TokenRepository(SOON_ENV);
  private tokenStatsRepo = new TokenStatsRepository(SOON_ENV);
  private tokenDistributionRepo = new TokenDistributionRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.TOKEN, httpClient);
  }

  public create = (req: WenRequest): Observable<Token | undefined> =>
    this.request(WEN_FUNC.createToken, req);

  public update = (req: WenRequest): Observable<Token | undefined> =>
    this.request(WEN_FUNC.updateToken, req);

  public setTokenAvailableForSale = (req: WenRequest): Observable<Token | undefined> =>
    this.request(WEN_FUNC.setTokenAvailableForSale, req);

  public vote = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.voteController, req);

  public rank = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.rankController, req);

  public cancelPublicSale = (req: WenRequest): Observable<Token | undefined> =>
    this.request(WEN_FUNC.cancelPublicSale, req);

  public airdropToken = (req: WenRequest): Observable<TokenDistribution[] | undefined> =>
    this.request(WEN_FUNC.airdropToken, req);

  public airdropMintedToken = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.airdropMintedToken, req);

  public creditToken = (req: WenRequest): Observable<Transaction[] | undefined> =>
    this.request(WEN_FUNC.creditToken, req);

  public claimAirdroppedToken = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.claimAirdroppedToken, req);

  public claimMintedToken = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.claimMintedTokenOrder, req);

  public depositStake = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.depositStake, req);

  public voteOnProposal = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.voteOnProposal, req);

  public enableTrading = (req: WenRequest): Observable<Token | undefined> =>
    this.request(WEN_FUNC.enableTokenTrading, req);

  public getMembersDistribution(tokenId: string, memberId: string) {
    if (!tokenId || !memberId) {
      return of(undefined);
    }
    return this.tokenDistributionRepo.getByIdLive(tokenId.toLowerCase(), memberId.toLowerCase());
  }

  public getDistributions(tokenId?: string): Observable<TokenDistribution[] | undefined> {
    if (!tokenId) {
      return of(undefined);
    }
    return this.tokenDistributionRepo.getAllLive(tokenId.toLowerCase());
  }

  public stats(tokenId: string) {
    if (!tokenId) {
      return of(undefined);
    }
    return this.tokenStatsRepo.getByIdLive(tokenId.toLowerCase(), tokenId.toLowerCase());
  }

  public topPublic = (lastValue?: string, limit?: number) =>
    this.tokenRepo.getByStatusLive([], lastValue, limit);

  public top = (lastValue?: string, limit?: number): Observable<Token[]> =>
    this.tokenRepo.getTopLive(lastValue, limit);

  public space = (space: string, lastValue?: string) =>
    this.tokenRepo.getBySpaceLive(space, lastValue);
}
