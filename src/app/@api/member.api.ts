import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  NetworkAddress,
  Member,
  Proposal,
  Dataset,
  SOON_TOKEN,
  SOON_TOKEN_TEST,
  Stake,
  Token,
  TokenDistribution,
  TokenDrop,
  TokenDropStatus,
  Transaction,
  WEN_FUNC,
  BuildcoreRequest,
  BUILDCORE_PROD_ADDRESS_API,
  BUILDCORE_TEST_ADDRESS_API,
  Subset,
  MemberUpdateRequest,
  CustomTokenRequest,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { Observable, combineLatest, map, of, switchMap } from 'rxjs';
import { BaseApi } from './base.api';

export interface TokenDistributionWithAirdrops extends TokenDistribution {
  tokenDrops: TokenDrop[];
}

export interface TokenWithMemberDistribution extends Token {
  distribution: TokenDistributionWithAirdrops;
}

export interface TransactionWithFullMember extends Transaction {
  memberRec?: Member;
}

export interface StakeWithTokenRec extends Stake {
  tokenRec: Token;
}

@Injectable({
  providedIn: 'root',
})
export class MemberApi extends BaseApi<Member> {
  protected memberDataset = this.project.dataset(Dataset.MEMBER);
  protected airdropDataset = this.project.dataset(Dataset.AIRDROP);
  protected stakeDataset = this.project.dataset(Dataset.STAKE);
  protected tokenDataset = this.project.dataset(Dataset.TOKEN);
  protected spaceDataset = this.project.dataset(Dataset.SPACE);
  protected awardDataset = this.project.dataset(Dataset.AWARD);
  protected proposalDataset = this.project.dataset(Dataset.PROPOSAL);
  protected transactionDataset = this.project.dataset(Dataset.TRANSACTION);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.MEMBER, httpClient);
  }

  public soonDistributionStats = (id: NetworkAddress) => {
    const tokenId = environment.production ? SOON_TOKEN : SOON_TOKEN_TEST;
    return this.tokenDataset
      .id(tokenId)
      .subset(Subset.DISTRIBUTION)
      .subsetId(id.toLowerCase())
      .getLive()
      .pipe(
        switchMap(async (distribution) => {
          if (!distribution) {
            return;
          }
          const tokenDrops = await this.airdropDataset.getByField(
            ['member', 'token', 'status'],
            [id.toLowerCase(), tokenId, TokenDropStatus.UNCLAIMED],
          );
          return { ...distribution, tokenDrops };
        }),
      ) as Observable<TokenDistributionWithAirdrops | undefined>;
  };

  public listenMultiple = (ids: NetworkAddress[]) =>
    ids.length
      ? this.memberDataset
          .getByFieldLive(
            ids.map(() => 'uid'),
            ids,
          )
          .pipe(
            map((members) => {
              members.sort((a, b) => (a.createdOn?.seconds || 0) - (b.createdOn?.seconds || 0));
              return members;
            }),
          )
      : of([]);

  public topStakes = (
    memberId: NetworkAddress,
    lastValue?: string,
  ): Observable<StakeWithTokenRec[]> =>
    this.stakeDataset.getByMemberLive(memberId, lastValue).pipe(
      switchMap(async (stakes: Stake[]) => {
        const tokenIds = Array.from(new Set(stakes.map((s) => s.token)));
        const tokenPromises = tokenIds.map((id) => this.tokenDataset.id(id).get());
        const tokens = await Promise.all(tokenPromises);

        return stakes.map((stake) => ({
          ...stake,
          tokenRec: tokens.find((t) => t?.uid === stake.token)!,
        }));
      }),
    );

  public topTokens = (memberId: NetworkAddress): Observable<TokenWithMemberDistribution[]> =>
    this.tokenDataset
      .subset(Subset.DISTRIBUTION)
      .getTopBySubColIdLive(memberId, [], [])
      .pipe(
        switchMap(async (distributions) => {
          const promises = distributions.map(async (distribution) => {
            const token = await this.tokenDataset.id(distribution.parentId).get();
            const tokenDrops = await this.airdropDataset.getByField(
              ['member', 'token', 'status'],
              [memberId, distribution.parentId, TokenDropStatus.UNCLAIMED],
            );
            return {
              ...token,
              distribution: { ...distribution, tokenDrops },
            } as TokenWithMemberDistribution;
          });
          return await Promise.all(promises);
        }),
      );

  public topSpaces = (
    memberId: NetworkAddress,
    orderBy = ['createdOn'],
    orderByDir = ['desc'],
    lastValue?: string,
    limit?: number,
  ) => this.spaceDataset.getTopByMember(memberId, orderBy, orderByDir, lastValue, limit);

  public pendingSpaces = (
    memberId: NetworkAddress,
    orderBy = ['createdOn'],
    orderByDir = ['desc'],
    lastValue?: string,
  ) => this.spaceDataset.getPendingSpacesByMemberLive(memberId, orderBy, orderByDir, lastValue);

  public topAwardsPending = (memberId: NetworkAddress, lastValue?: string) =>
    this.awardDataset.getTopByMemberLive(memberId, false, lastValue);

  public topAwardsCompleted = (memberId: NetworkAddress, lastValue?: string) =>
    this.awardDataset.getTopByMemberLive(memberId, true, lastValue);

  public topProposals = (
    memberId: NetworkAddress,
    orderBy = ['createdOn'],
    orderByDir = ['desc'],
    lastValue?: string,
  ) =>
    this.proposalDataset
      .subset(Subset.MEMBERS)
      .getTopBySubColIdLive(memberId, orderBy, orderByDir, lastValue)
      .pipe(
        switchMap(async (members) => {
          const result: Proposal[] = [];
          for (const member of members) {
            const proposal = (await this.proposalDataset.id(member.parentId).get())!;
            const endDate = proposal.settings.endDate?.toDate();
            if (endDate && dayjs(endDate).isAfter(dayjs(new Date()))) {
              result.push(proposal);
            }
          }
          return result;
        }),
      );

  public topBadges(
    memberId: string,
    orderBy: string | string[] = 'createdOn',
    lastValue?: string,
  ): Observable<Transaction[]> {
    const orderBys = Array.isArray(orderBy) ? orderBy : [orderBy];
    return this.transactionDataset.getBadgesForMemberLive(memberId, orderBys, lastValue);
  }

  public topTransactions(
    memberId: string,
    orderBy: string | string[] = 'createdOn',
    lastValue?: string,
  ): Observable<Transaction[]> {
    const orderBys = Array.isArray(orderBy) ? orderBy : [orderBy];

    const prevOwner = this.transactionDataset
      .getTopTransactionsLive(orderBys, lastValue, undefined, memberId)
      .pipe(map((result) => result.filter((t) => t.member !== memberId)));

    const members = this.transactionDataset.getTopTransactionsLive(orderBys, lastValue, memberId);

    return combineLatest([prevOwner, members]).pipe(
      map((combined) =>
        combined.flat().sort((a, b) => {
          const aTime = a.createdOn?.toDate().getTime() || 0;
          const bTime = b.createdOn?.toDate().getTime() || 0;
          return -aTime + bTime;
        }),
      ),
    );
  }

  public allSpacesAsMember = (memberId: NetworkAddress, lastValue?: string) =>
    this.spaceDataset
      .subset(Subset.MEMBERS)
      .getTopBySubColIdLive(memberId, [], [], lastValue)
      .pipe(
        switchMap(async (spaceMembers) => {
          const spacePromises = spaceMembers.map(
            async (member) => (await this.spaceDataset.id(member.parentId).get())!,
          );
          return await Promise.all(spacePromises);
        }),
      );

  public createIfNotExists = (address: string): Observable<Member | undefined> =>
    this.request(WEN_FUNC.createMember, {
      address: address,
      projectApiKey: environment.buildcoreToken,
      body: {
        address,
      },
    });

  public updateMember = (req: BuildcoreRequest<MemberUpdateRequest>): Observable<Member | undefined> =>
    this.request(WEN_FUNC.updateMember, req);

  public generateAuthToken = (
    req: BuildcoreRequest<CustomTokenRequest>,
  ): Observable<string | undefined> => {
    const origin = environment.production ? BUILDCORE_PROD_ADDRESS_API : BUILDCORE_TEST_ADDRESS_API;
    return <any>this.httpClient.post(origin + WEN_FUNC.generateCustomToken, req, {
      responseType: 'text',
    });
  };
}
