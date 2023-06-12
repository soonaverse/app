import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  EthAddress,
  Member,
  Proposal,
  PublicCollections,
  Timestamp,
  Transaction,
  WEN_FUNC,
  WenRequest,
} from '@soonaverse/interfaces';
import {
  MemberRepository,
  ProposalMemberRepository,
  ProposalRepository,
  TransactionRepository,
} from '@soonaverse/lib';
import { Observable, map, of, switchMap } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

export enum ProposalFilter {
  ALL = 'all',
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export interface ProposalParticipantWithMember extends Member {
  voted?: boolean;
  weight?: number;
  values?: number[];

  // Only internal variable.
  _issuedOn?: Timestamp;
}

export interface TransactionWithFullMember extends Transaction {
  memberRec?: Member;
}

@Injectable({
  providedIn: 'root',
})
export class ProposalApi extends BaseApi<Proposal> {
  private memberRepo = new MemberRepository(SOON_ENV);
  private proposalRepo = new ProposalRepository(SOON_ENV);
  private transactionRepo = new TransactionRepository(SOON_ENV);
  private proposalMemberRepo = new ProposalMemberRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.PROPOSAL, httpClient);
  }

  public listen = (id: EthAddress) => this.proposalRepo.getByIdLive(id);

  public lastActive = (lastValue?: string) => this.proposalRepo.getActiveLive(lastValue);

  public listenSpace = (
    space: string,
    filter: ProposalFilter = ProposalFilter.ALL,
    lastValue?: string,
  ) => this.proposalRepo.getBySpaceAndFilterLive(space, filter, lastValue);

  public lastVotes = (proposalId: string, lastValue?: string) =>
    this.transactionRepo.getLatestVotesForProposalLive(proposalId, undefined, lastValue).pipe(
      switchMap(async (transactions) => {
        const memberIds = Array.from(new Set(transactions.map((t) => t.member!)));
        const memberPromises = memberIds.map((id) => this.memberRepo.getById(id));
        const members = await Promise.all(memberPromises);

        return transactions.map(
          (t) =>
            ({
              ...t,
              memberRec: members.find((m) => m?.uid === t.member),
            } as TransactionWithFullMember),
        );
      }),
    );

  public getMembersVotes = (proposalId: string, memberId: string, lastValue?: string) =>
    this.transactionRepo.getLatestVotesForProposalLive(proposalId, memberId, lastValue);

  public canMemberVote(proposalId: string, memberId: string) {
    if (!proposalId || !memberId) {
      return of(false);
    }
    return this.proposalMemberRepo
      .getByIdLive(proposalId, memberId)
      .pipe(map((member) => !!member));
  }

  public listenPendingMembers = (proposalId: string, lastValue?: string) =>
    this.proposalMemberRepo.getVotingMembersLive(proposalId, false, lastValue).pipe(
      switchMap(async (proposalMembers) => {
        const memberPromises = proposalMembers.map(async (propMember) => {
          const member = (await this.memberRepo.getById(propMember.uid))!;
          return {
            ...member,
            voted: propMember.voted,
            weight: propMember.weight,
            values: propMember.values,
            _issuedOn: propMember.createdOn,
          } as ProposalParticipantWithMember;
        });
        return await Promise.all(memberPromises);
      }),
    );

  public listenVotedMembers = (proposalId: string, lastValue?: string) =>
    this.proposalMemberRepo.getVotingMembersLive(proposalId, true, lastValue).pipe(
      switchMap(async (proposalMembers) => {
        const memberPromises = proposalMembers.map(async (propMember) => {
          const member = (await this.memberRepo.getById(propMember.uid))!;
          return {
            ...member,
            voted: propMember.voted,
            weight: propMember.weight,
            values: propMember.values,
            _issuedOn: propMember.createdOn,
          } as ProposalParticipantWithMember;
        });
        return await Promise.all(memberPromises);
      }),
    );

  public create = (req: WenRequest): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.createProposal, req);

  public approve = (req: WenRequest): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.approveProposal, req);

  public reject = (req: WenRequest): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.rejectProposal, req);

  public vote = (req: WenRequest): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.voteOnProposal, req);
}
