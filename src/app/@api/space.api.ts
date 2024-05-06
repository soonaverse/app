import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  BuildcoreRequest,
  Dataset,
  QUERY_MAX_LENGTH,
  Space,
  SpaceClaimRequest,
  SpaceCreateRequest,
  SpaceJoinRequest,
  SpaceLeaveRequest,
  SpaceMember,
  SpaceMemberUpsertRequest,
  SpaceUpdateRequest,
  Subset,
  WEN_FUNC,
} from '@buildcore/interfaces';
import { Observable, map, of, switchMap } from 'rxjs';
import { BaseApi } from './base.api';
import { chunkArray } from '@core/utils/common.utils';

@Injectable({
  providedIn: 'root',
})
export class SpaceApi extends BaseApi<Space> {
  private memberDataset = this.project.dataset(Dataset.MEMBER);
  private spaceDataset = this.project.dataset(Dataset.SPACE);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.SPACE, httpClient);
  }

  public isMemberWithinSpace(spaceId: string, memberId: string): Observable<boolean> {
    if (!spaceId || !memberId) {
      return of(false);
    }
    return this.spaceDataset
      .id(spaceId)
      .subset(Subset.MEMBERS)
      .subsetId(memberId)
      .getLive()
      .pipe(map((member) => !!member));
  }

  public isGuardianWithinSpace(spaceId: string, memberId: string): Observable<boolean> {
    if (!spaceId || !memberId) {
      return of(false);
    }
    return this.spaceDataset
      .id(spaceId)
      .subset(Subset.GUARDIANS)
      .subsetId(memberId)
      .getLive()
      .pipe(map((member) => !!member));
  }

  public isPendingMemberWithinSpace(spaceId: string, memberId: string): Observable<boolean> {
    if (!spaceId || !memberId) {
      return of(false);
    }
    return this.spaceDataset
      .id(spaceId)
      .subset(Subset.KNOCKING_MEMBERS)
      .subsetId(memberId)
      .getLive()
      .pipe(map((member) => !!member));
  }

  public listenGuardians = (spaceId: string, lastValue?: string) =>
    this.spaceDataset
      .id(spaceId)
      .subset(Subset.GUARDIANS)
      .getAllLive(lastValue)
      .pipe(switchMap(this.getMembers));

  public getMembersWithoutData = (spaceId: string, lastValue?: string) =>
    this.spaceDataset.id(spaceId).subset(Subset.MEMBERS).getAll(lastValue);

  public getAllMembersWithoutData = async (spaceId: string) => {
    const members: SpaceMember[] = [];
    let actMembers: SpaceMember[] = [];
    do {
      const last = members[members.length - 1]?.uid;
      actMembers = await this.getMembersWithoutData(spaceId, last);
      members.push(...actMembers);
    } while (members.length === QUERY_MAX_LENGTH);
    return members;
  };

  public listenMembers = (spaceId: string, lastValue?: string, searchIds?: string[]) => {
    const baseObs = searchIds?.length
      ? this.spaceDataset
          .id(spaceId)
          .subset(Subset.MEMBERS)
          .getManyByIdLive(searchIds.slice(0, 100))
      : this.spaceDataset.id(spaceId).subset(Subset.MEMBERS).getAllLive(lastValue);
    return baseObs.pipe(switchMap(this.getMembers));
  };

  public listenBlockedMembers = (spaceId: string, lastValue?: string, searchIds?: string[]) => {
    const subset = this.spaceDataset.id(spaceId).subset(Subset.BLOCKED_MEMBERS);
    const baseObs = searchIds?.length
      ? subset.getManyByIdLive(searchIds.slice(0, 100))
      : subset.getAllLive(lastValue);
    return baseObs.pipe(switchMap(this.getMembers));
  };

  public listenPendingMembers = (spaceId: string, lastValue?: string, searchIds?: string[]) => {
    const subset = this.spaceDataset.id(spaceId).subset(Subset.KNOCKING_MEMBERS);
    const baseObs = searchIds?.length
      ? subset.getManyByIdLive(searchIds.slice(0, 100))
      : subset.getAllLive(lastValue);
    return baseObs.pipe(switchMap(this.getMembers));
  };

  private getMembers = async (spaceMembers: SpaceMember[]) => {
    const uids = spaceMembers.map((m) => m.uid);
    const promises = chunkArray(uids, QUERY_MAX_LENGTH).map((chunk) =>
      this.memberDataset.getManyById(chunk),
    );
    return (await Promise.all(promises)).flat();
  };

  public create = (req: BuildcoreRequest<SpaceCreateRequest>): Observable<Space | undefined> =>
    this.request(WEN_FUNC.createSpace, req);

  public save = (req: BuildcoreRequest<SpaceUpdateRequest>): Observable<Space | undefined> =>
    this.request(WEN_FUNC.updateSpace, req);

  public join = (req: BuildcoreRequest<SpaceJoinRequest>): Observable<Space | undefined> =>
    this.request(WEN_FUNC.joinSpace, req);

  public leave = (req: BuildcoreRequest<SpaceLeaveRequest>): Observable<Space | undefined> =>
    this.request(WEN_FUNC.leaveSpace, req);

  public setGuardian = (
    req: BuildcoreRequest<SpaceMemberUpsertRequest>,
  ): Observable<Space | undefined> => this.request(WEN_FUNC.addGuardianSpace, req);

  public claimSpace = (req: BuildcoreRequest<SpaceClaimRequest>): Observable<Space | undefined> =>
    this.request(WEN_FUNC.claimSpace, req);

  public removeGuardian = (
    req: BuildcoreRequest<SpaceMemberUpsertRequest>,
  ): Observable<Space | undefined> => this.request(WEN_FUNC.removeGuardianSpace, req);

  public blockMember = (
    req: BuildcoreRequest<SpaceMemberUpsertRequest>,
  ): Observable<Space | undefined> => this.request(WEN_FUNC.blockMemberSpace, req);

  public unblockMember = (
    req: BuildcoreRequest<SpaceMemberUpsertRequest>,
  ): Observable<Space | undefined> => this.request(WEN_FUNC.unblockMemberSpace, req);

  public acceptMember = (
    req: BuildcoreRequest<SpaceMemberUpsertRequest>,
  ): Observable<Space | undefined> => this.request(WEN_FUNC.acceptMemberSpace, req);

  public rejectMember = (
    req: BuildcoreRequest<SpaceMemberUpsertRequest>,
  ): Observable<Space | undefined> => this.request(WEN_FUNC.declineMemberSpace, req);

  public update = (req: BuildcoreRequest<SpaceUpdateRequest>): Observable<Space | undefined> =>
    this.request(WEN_FUNC.updateSpace, req);
}
