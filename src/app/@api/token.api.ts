import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  QUERY_MAX_LENGTH,
  Token,
  TokenDistribution,
  Transaction,
  WEN_FUNC,
  BuildcoreRequest,
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
} from '@buildcore/interfaces';
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

  public create = (req: BuildcoreRequest<TokenCreateRequest>): Observable<Token | undefined> =>
    this.request(WEN_FUNC.createToken, req);

  public update = (req: BuildcoreRequest<TokenUpdateRequest>): Observable<Token | undefined> =>
    this.request(WEN_FUNC.updateToken, req);

  public setTokenAvailableForSale = (
    req: BuildcoreRequest<SetTokenForSaleRequest>,
  ): Observable<Token | undefined> => this.request(WEN_FUNC.setTokenAvailableForSale, req);

  public vote = (req: BuildcoreRequest<VoteRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.voteController, req);

  public rank = (req: BuildcoreRequest<RankRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.rankController, req);

  public cancelPublicSale = (
    req: BuildcoreRequest<CanelPublicSaleRequest>,
  ): Observable<Token | undefined> => this.request(WEN_FUNC.cancelPublicSale, req);

  public airdropToken = (
    req: BuildcoreRequest<CreateAirdropsRequest>,
  ): Observable<TokenDistribution[] | undefined> => this.request(WEN_FUNC.airdropToken, req);

  public airdropMintedToken = (
    req: BuildcoreRequest<CreateAirdropsRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.airdropMintedToken, req);

  public creditToken = (
    req: BuildcoreRequest<CreditTokenRequest>,
  ): Observable<Transaction[] | undefined> => this.request(WEN_FUNC.creditToken, req);

  public claimAirdroppedToken = (
    req: BuildcoreRequest<ClaimAirdroppedTokensRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.claimAirdroppedToken, req);

  public claimMintedToken = (
    req: BuildcoreRequest<ClaimPreMintedAirdroppedTokensRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.claimMintedTokenOrder, req);

  public depositStake = (
    req: BuildcoreRequest<TokenStakeRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.depositStake, req);

  public voteOnProposal = (
    req: BuildcoreRequest<ProposalVoteRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.voteOnProposal, req);

  public enableTrading = (
    req: BuildcoreRequest<EnableTokenTradingRequest>,
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
