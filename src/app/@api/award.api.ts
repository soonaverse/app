import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Award,
  AwardApproveParticipantRequest,
  AwardCreateRequest,
  AwardFundRequest,
  AwardParticpateRequest,
  AwardRejectRequest,
  Build5Request,
  Dataset,
  Member,
  Subset,
  Timestamp,
  WEN_FUNC,
} from '@build-5/interfaces';
import { map, Observable, of } from 'rxjs';
import { AwardFilter, BaseApi } from './base.api';

export interface AwardParticipantWithMember extends Member {
  comment?: string;
  participatedOn: Timestamp;
  completed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AwardApi extends BaseApi<Award> {
  private awardDataset = this.project.dataset(Dataset.AWARD);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.AWARD, httpClient);
  }

  public listenSpace = (space: string, filter = AwardFilter.ALL, lastValue?: string) => {
    switch (filter) {
      case AwardFilter.ALL:
        return this.awardDataset.getBySpaceLive(space, lastValue);
      case AwardFilter.ACTIVE:
        return this.awardDataset.getActiveLive(space, lastValue);
      case AwardFilter.COMPLETED:
        return this.awardDataset.getCompletedLive(space, lastValue);
      case AwardFilter.DRAFT:
        return this.awardDataset.getDraftLive(space, lastValue);
      case AwardFilter.REJECTED:
        return this.awardDataset.getRejectedLive(space, lastValue);
    }
  };

  public listenOwners = (award: string, lastValue?: string) =>
    this.awardDataset.id(award).subset(Subset.OWNERS).getAllLive(lastValue);

  public lastActive = (lastValue?: string) => this.awardDataset.getLastActiveLive(lastValue);

  public listenPendingParticipants = (award: string, lastValue?: string, searchIds?: string[]) =>
    this.awardDataset
      .id(award)
      .subset(Subset.PARTICIPANTS)
      .getParticipantsLive(award, false, searchIds, lastValue)
      .pipe(
        map((participants) => participants.map((p) => ({ ...p, participatedOn: p.createdOn }))),
      );

  public listenIssuedParticipants = (award: string, lastValue?: string, searchIds?: string[]) =>
    this.awardDataset
      .id(award)
      .subset(Subset.PARTICIPANTS)
      .getParticipantsLive(award, true, searchIds, lastValue)
      .pipe(
        map((participants) => participants.map((p) => ({ ...p, participatedOn: p.createdOn }))),
      );

  public isMemberParticipant(awardId: string, memberId: string): Observable<boolean> {
    if (!awardId || !memberId) {
      return of(false);
    }
    return this.awardDataset
      .id(awardId)
      .subset(Subset.PARTICIPANTS)
      .subsetId(memberId)
      .getLive()
      .pipe(map((awardMember) => !!awardMember));
  }

  public create = (req: Build5Request<AwardCreateRequest>): Observable<Award | undefined> =>
    this.request(WEN_FUNC.createAward, req);

  public participate = (
    req: Build5Request<AwardParticpateRequest>,
  ): Observable<Award | undefined> => this.request(WEN_FUNC.participateAward, req);

  public approveParticipant = (
    req: Build5Request<AwardApproveParticipantRequest>,
  ): Observable<Award | undefined> => this.request(WEN_FUNC.approveParticipantAward, req);

  public approve = (req: Build5Request<AwardFundRequest>): Observable<Award | undefined> =>
    this.request(WEN_FUNC.fundAward, req);

  public reject = (req: Build5Request<AwardRejectRequest>): Observable<Award | undefined> =>
    this.request(WEN_FUNC.rejectAward, req);

  public fundAndMint = (req: Build5Request<AwardFundRequest>): Observable<Award | undefined> =>
    this.request(WEN_FUNC.fundAward, req);
}
