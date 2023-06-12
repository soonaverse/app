import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  EthAddress,
  Member,
  Proposal,
  PublicCollections,
  SOON_TOKEN,
  SOON_TOKEN_TEST,
  Stake,
  Token,
  TokenDistribution,
  TokenDrop,
  TokenDropStatus,
  Transaction,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import {
  AirdropRepository,
  AwardParticipantRepository,
  AwardRepository,
  MemberRepository,
  ProposalMemberRepository,
  ProposalRepository,
  SpaceKnockingMemberRepository,
  SpaceMemberRepository,
  SpaceRepository,
  StakeRepository,
  TokenDistributionRepository,
  TokenRepository,
  TransactionRepository,
} from '@build-5/lib';
import dayjs from 'dayjs';
import { Observable, combineLatest, map, switchMap } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

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
  protected memberRepo = new MemberRepository(SOON_ENV);
  protected tokenDistRepo = new TokenDistributionRepository(SOON_ENV);
  protected airdropRepo = new AirdropRepository(SOON_ENV);
  protected stakeRepo = new StakeRepository(SOON_ENV);
  protected tokenRepo = new TokenRepository(SOON_ENV);
  protected spaceRepo = new SpaceRepository(SOON_ENV);
  protected spaceMemberRepo = new SpaceMemberRepository(SOON_ENV);
  protected spaceKnockingRepo = new SpaceKnockingMemberRepository(SOON_ENV);
  protected awardRepo = new AwardRepository(SOON_ENV);
  protected awardParticipantRepo = new AwardParticipantRepository(SOON_ENV);
  protected proposalRepo = new ProposalRepository(SOON_ENV);
  protected proposalMemberRepo = new ProposalMemberRepository(SOON_ENV);
  protected transactionRepo = new TransactionRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.MEMBER, httpClient);
  }

  public soonDistributionStats = (id: EthAddress) => {
    const tokenId = environment.production ? SOON_TOKEN : SOON_TOKEN_TEST;
    return this.tokenDistRepo.getByIdLive(tokenId, id.toLowerCase()).pipe(
      switchMap(async (distribution) => {
        if (!distribution) {
          return;
        }
        const tokenDrops = await this.airdropRepo.getByField(
          ['member', 'token', 'status'],
          [id.toLowerCase(), tokenId, TokenDropStatus.UNCLAIMED],
        );
        return { ...distribution, tokenDrops };
      }),
    ) as Observable<TokenDistributionWithAirdrops | undefined>;
  };

  public listenMultiple = (ids: EthAddress[]) =>
    this.memberRepo
      .getByFieldLive(
        ids.map(() => 'uid'),
        ids,
      )
      .pipe(
        map((members) => {
          members.sort((a, b) => (a.createdOn?.seconds || 0) - (b.createdOn?.seconds || 0));
          return members;
        }),
      );

  public topStakes = (memberId: EthAddress, lastValue?: string): Observable<StakeWithTokenRec[]> =>
    this.stakeRepo.getByMemberLive(memberId, lastValue).pipe(
      switchMap(async (stakes: Stake[]) => {
        const tokenIds = Array.from(new Set(stakes.map((s) => s.token)));
        const tokenPromises = tokenIds.map((id) => this.tokenRepo.getById(id));
        const tokens = await Promise.all(tokenPromises);

        return stakes.map((stake) => ({
          ...stake,
          tokenRec: tokens.find((t) => t?.uid === stake.token)!,
        }));
      }),
    );

  public topTokens = (memberId: EthAddress): Observable<TokenWithMemberDistribution[]> =>
    this.tokenDistRepo.getTopBySubColIdLive(memberId, [], []).pipe(
      switchMap(async (distributions) => {
        const promises = distributions.map(async (distribution) => {
          const token = await this.tokenRepo.getById(distribution.parentId);
          const tokenDrops = await this.airdropRepo.getByField(
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
    memberId: EthAddress,
    orderBy = ['createdOn'],
    orderByDir = ['desc'],
    lastValue?: string,
    limit?: number,
  ) => this.spaceRepo.getTopByMember(memberId, orderBy, orderByDir, lastValue, limit);

  public pendingSpaces = (
    memberId: EthAddress,
    orderBy = ['createdOn'],
    orderByDir = ['desc'],
    lastValue?: string,
  ) => this.spaceRepo.getPendingSpacesByMemberLive(memberId, orderBy, orderByDir, lastValue);

  public topAwardsPending = (memberId: EthAddress, lastValue?: string) =>
    this.awardRepo.getTopByMemberLive(memberId, false, lastValue);

  public topAwardsCompleted = (memberId: EthAddress, lastValue?: string) =>
    this.awardRepo.getTopByMemberLive(memberId, true, lastValue);

  public topProposals = (
    memberId: EthAddress,
    orderBy = ['createdOn'],
    orderByDir = ['desc'],
    lastValue?: string,
  ) =>
    this.proposalMemberRepo.getTopBySubColIdLive(memberId, orderBy, orderByDir, lastValue).pipe(
      switchMap(async (members) => {
        const result: Proposal[] = [];
        for (const member of members) {
          const proposal = (await this.proposalRepo.getById(member.parentId))!;
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
    return this.transactionRepo.getBadgesForMemberLive(memberId, orderBys, lastValue);
  }

  public topTransactions(
    memberId: string,
    orderBy: string | string[] = 'createdOn',
    lastValue?: string,
  ): Observable<Transaction[]> {
    const orderBys = Array.isArray(orderBy) ? orderBy : [orderBy];

    const all = this.transactionRepo
      .getTopTransactionsLive(orderBys, lastValue)
      .pipe(map((result) => result.filter((t) => t.member !== memberId)));

    const members = this.transactionRepo.getTopTransactionsLive(orderBys, lastValue, memberId);

    return combineLatest([all, members]).pipe(
      map(([notForMember, forMember]) =>
        [...notForMember, ...forMember].sort((a, b) => {
          const aTime = a.createdOn?.toDate().getTime() || 0;
          const bTime = b.createdOn?.toDate().getTime() || 0;
          return -aTime + bTime;
        }),
      ),
    );
  }

  public allSpacesAsMember = (memberId: EthAddress, lastValue?: string) =>
    this.spaceMemberRepo.getTopBySubColIdLive(memberId, [], [], lastValue).pipe(
      switchMap(async (spaceMembers) => {
        const spacePromises = spaceMembers.map(
          async (member) => (await this.spaceRepo.getById(member.parentId))!,
        );
        return await Promise.all(spacePromises);
      }),
    );

  public createIfNotExists = (address: string): Observable<Member | undefined> =>
    this.request(WEN_FUNC.createMember, address);

  public updateMember = (req: WenRequest): Observable<Member | undefined> =>
    this.request(WEN_FUNC.updateMember, req);

  public generateAuthToken = (req: WenRequest): Observable<string | undefined> =>
    this.request(WEN_FUNC.generateCustomToken, req);
}
