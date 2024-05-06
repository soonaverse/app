import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Member,
  Proposal,
  Dataset,
  Timestamp,
  Transaction,
  WEN_FUNC,
  BuildcoreRequest,
  Subset,
  ProposalCreateRequest,
  ApproveProposalRequest,
  RejectProposalRequest,
  ProposalVoteRequest,
} from '@buildcore/interfaces';
import { Observable, map, of, switchMap } from 'rxjs';
import { BaseApi } from './base.api';

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
  private memberDataset = this.project.dataset(Dataset.MEMBER);
  private proposalDataset = this.project.dataset(Dataset.PROPOSAL);
  private transactionDataset = this.project.dataset(Dataset.TRANSACTION);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.PROPOSAL, httpClient);
  }

  public listenSpace = (space: string, filter = ProposalFilter.ALL, lastValue?: string) => {
    switch (filter) {
      case ProposalFilter.ALL:
        return this.proposalDataset.getBySpaceLive(space, lastValue);
      case ProposalFilter.ACTIVE:
        return this.proposalDataset.getActiveLive(space, lastValue);
      case ProposalFilter.COMPLETED:
        return this.proposalDataset.getCompletedLive(space, lastValue);
      case ProposalFilter.REJECTED:
        return this.proposalDataset.getRejectedLive(space, lastValue);
      case ProposalFilter.DRAFT:
        return this.proposalDataset.getDraftLive(space, lastValue);
    }
  };

  public lastVotes = (proposalId: string, lastValue?: string) =>
    this.transactionDataset.getLatestVotesForProposalLive(proposalId, undefined, lastValue).pipe(
      switchMap(async (transactions) => {
        const memberIds = Array.from(new Set(transactions.map((t) => t.member!)));
        const memberPromises = memberIds.map((id) => this.memberDataset.id(id).get());
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
    this.transactionDataset.getLatestVotesForProposalLive(proposalId, memberId, lastValue);

  public canMemberVote(proposalId: string, memberId: string) {
    if (!proposalId || !memberId) {
      return of(false);
    }
    return this.proposalDataset
      .id(proposalId)
      .subset(Subset.MEMBERS)
      .subsetId(memberId)
      .getLive()
      .pipe(map((member) => !!member));
  }

  public listenPendingMembers = (proposalId: string, lastValue?: string) =>
    this.proposalDataset
      .id(proposalId)
      .subset(Subset.MEMBERS)
      .getVotingMembersLive(false, lastValue)
      .pipe(
        switchMap(async (proposalMembers) => {
          const memberPromises = proposalMembers.map(async (propMember) => {
            const member = (await this.memberDataset.id(propMember.uid).get())!;
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
    this.proposalDataset
      .id(proposalId)
      .subset(Subset.MEMBERS)
      .getVotingMembersLive(true, lastValue)
      .pipe(
        switchMap(async (proposalMembers) => {
          const memberPromises = proposalMembers.map(async (propMember) => {
            const member = (await this.memberDataset.id(propMember.uid).get())!;
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

  public create = (req: BuildcoreRequest<ProposalCreateRequest>): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.createProposal, req);

  public approve = (req: BuildcoreRequest<ApproveProposalRequest>): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.approveProposal, req);

  public reject = (req: BuildcoreRequest<RejectProposalRequest>): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.rejectProposal, req);

  public vote = (req: BuildcoreRequest<ProposalVoteRequest>): Observable<Proposal | undefined> =>
    this.request(WEN_FUNC.voteOnProposal, req);
}
