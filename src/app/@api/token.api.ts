import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  QUERY_MAX_LENGTH,
  Token,
  TokenDistribution,
  Transaction,
  WEN_FUNC,
  Build5Request,
  TokenCreateRequest,
  TokenUpdateRequest,
  VoteRequest,
  RankRequest,
  CanelPublicSaleRequest,
  CreateAirdropsRequest,
  SetTokenForSaleRequest,
  CreditTokenRequest,
  ClaimAirdroppedTokensRequest,
  ClaimPreMintedAirdroppedTokensRequest,
  TokenStakeRequest,
  ProposalVoteRequest,
  EnableTokenTradingRequest,
  Subset,
} from '@build-5/interfaces';
import { Observable, of } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenApi extends BaseApi<Token> {
  private tokenDataset = this.project.dataset(Dataset.TOKEN);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.TOKEN, httpClient);
  }

  public create = (req: Build5Request<TokenCreateRequest>): Observable<Token | undefined> =>
    this.request(WEN_FUNC.createToken, req);

  public update = (req: Build5Request<TokenUpdateRequest>): Observable<Token | undefined> =>
    this.request(WEN_FUNC.updateToken, req);

  public setTokenAvailableForSale = (
    req: Build5Request<SetTokenForSaleRequest>,
  ): Observable<Token | undefined> => this.request(WEN_FUNC.setTokenAvailableForSale, req);

  public vote = (req: Build5Request<VoteRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.voteController, req);

  public rank = (req: Build5Request<RankRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.rankController, req);

  public cancelPublicSale = (
    req: Build5Request<CanelPublicSaleRequest>,
  ): Observable<Token | undefined> => this.request(WEN_FUNC.cancelPublicSale, req);

  public airdropToken = (
    req: Build5Request<CreateAirdropsRequest>,
  ): Observable<TokenDistribution[] | undefined> => this.request(WEN_FUNC.airdropToken, req);

  public airdropMintedToken = (
    req: Build5Request<CreateAirdropsRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.airdropMintedToken, req);

  public creditToken = (
    req: Build5Request<CreditTokenRequest>,
  ): Observable<Transaction[] | undefined> => this.request(WEN_FUNC.creditToken, req);

  public claimAirdroppedToken = (
    req: Build5Request<ClaimAirdroppedTokensRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.claimAirdroppedToken, req);

  public claimMintedToken = (
    req: Build5Request<ClaimPreMintedAirdroppedTokensRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.claimMintedTokenOrder, req);

  public depositStake = (
    req: Build5Request<TokenStakeRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.depositStake, req);

  public voteOnProposal = (
    req: Build5Request<ProposalVoteRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.voteOnProposal, req);

  public enableTrading = (
    req: Build5Request<EnableTokenTradingRequest>,
  ): Observable<Token | undefined> => this.request(WEN_FUNC.enableTokenTrading, req);

  public getMembersDistribution(tokenId: string, memberId: string) {
    if (!tokenId || !memberId) {
      return of(undefined);
    }
    return this.tokenDataset
      .id(tokenId)
      .subset(Subset.DISTRIBUTION)
      .subsetId(memberId.toLowerCase())
      .getLive();
  }

  public getDistributionsLive = (tokenId?: string, lastValue?: string) =>
    tokenId
      ? this.tokenDataset.id(tokenId).subset(Subset.DISTRIBUTION).getAllLive(lastValue)
      : of([]);

  public getAllDistributions = async (tokenId?: string) => {
    if (!tokenId) {
      return [];
    }
    const distributions: TokenDistribution[] = [];
    let actDistributions: TokenDistribution[] = [];
    do {
      const last = distributions[distributions.length - 1]?.uid;
      actDistributions = await this.tokenDataset
        .id(tokenId)
        .subset(Subset.DISTRIBUTION)
        .getAll(last);
      distributions.push(...actDistributions);
    } while (actDistributions.length === QUERY_MAX_LENGTH);
    return distributions;
  };

  public getAllTokens = async () => {
    const tokens: Token[] = [];
    let actTokens: Token[] = [];
    do {
      const last = tokens[tokens.length - 1]?.uid;
      actTokens = await this.tokenDataset.getByField('approved', true, last);
      tokens.push(...actTokens);
    } while (actTokens.length === QUERY_MAX_LENGTH);
    return tokens;
  };

  public stats(tokenId: string) {
    if (!tokenId) {
      return of(undefined);
    }
    return this.tokenDataset
      .id(tokenId.toLowerCase())
      .subset(Subset.STATS)
      .subsetId(tokenId.toLowerCase())
      .getLive();
  }

  public topPublic = (lastValue?: string, limit?: number) =>
    this.tokenDataset.getByStatusLive([], lastValue, limit);

  public space = (space: string, lastValue?: string) =>
    this.tokenDataset.getBySpaceLive(space, lastValue);
}
