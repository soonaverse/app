import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Award,
  Member,
  PublicCollections,
  Timestamp,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import {
  AwardFilter,
  AwardOwnerRepository,
  AwardParticipantRepository,
  AwardRepository,
} from '@build-5/lib';

import { map, Observable, of } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

export interface AwardParticipantWithMember extends Member {
  comment?: string;
  participatedOn: Timestamp;
  completed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class AwardApi extends BaseApi<Award> {
  protected awardRepo = new AwardRepository(SOON_ENV);
  protected awardOwnerRepo = new AwardOwnerRepository(SOON_ENV);
  protected awardParticipantRepo = new AwardParticipantRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.AWARD, httpClient);
  }

  public listenSpace = (space: string, filter = AwardFilter.ALL) =>
    this.awardRepo.getBySpaceAndFilterLive(space, filter);

  public listenOwners = (award: string, lastValue?: string) =>
    this.awardOwnerRepo.getAllLive(award, lastValue);

  public lastActive = (lastValue?: string) => this.awardRepo.getLastActiveLive(lastValue);

  public listenPendingParticipants = (award: string, lastValue?: string, searchIds?: string[]) =>
    this.awardParticipantRepo
      .getParticipantsLive(award, false, searchIds, lastValue)
      .pipe(
        map((participants) => participants.map((p) => ({ ...p, participatedOn: p.createdOn }))),
      );

  public listenIssuedParticipants = (award: string, lastValue?: string, searchIds?: string[]) =>
    this.awardParticipantRepo
      .getParticipantsLive(award, true, searchIds, lastValue)
      .pipe(
        map((participants) => participants.map((p) => ({ ...p, participatedOn: p.createdOn }))),
      );

  public isMemberParticipant(awardId: string, memberId: string): Observable<boolean> {
    if (!awardId || !memberId) {
      return of(false);
    }
    return this.awardParticipantRepo
      .getByIdLive(awardId, memberId)
      .pipe(map((awardMember) => !!awardMember));
  }

  public create = (req: WenRequest): Observable<Award | undefined> =>
    this.request(WEN_FUNC.createAward, req);

  public participate = (req: WenRequest): Observable<Award | undefined> =>
    this.request(WEN_FUNC.participateAward, req);

  public approveParticipant = (req: WenRequest): Observable<Award | undefined> =>
    this.request(WEN_FUNC.approveParticipantAward, req);

  public approve = (req: WenRequest): Observable<Award | undefined> =>
    this.request(WEN_FUNC.fundAward, req);

  public reject = (req: WenRequest): Observable<Award | undefined> =>
    this.request(WEN_FUNC.rejectAward, req);

  public fundAndMint = (req: WenRequest): Observable<Award | undefined> =>
    this.request(WEN_FUNC.fundAward, req);
}
