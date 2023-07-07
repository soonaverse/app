import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Member,
  PublicCollections,
  QUERY_MAX_LENGTH,
  Space,
  SpaceMember,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import {
  MemberRepository,
  SpaceBlockedMemberRepository,
  SpaceGuardianRepository,
  SpaceKnockingMemberRepository,
  SpaceMemberRepository,
} from '@build-5/lib';
import { Observable, map, of, switchMap } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';
import { chunkArray } from '@core/utils/common.utils';

@Injectable({
  providedIn: 'root',
})
export class SpaceApi extends BaseApi<Space> {
  private memberRepo = new MemberRepository(SOON_ENV);
  private spaceMemberRepo = new SpaceMemberRepository(SOON_ENV);
  private spaceGuardianRepo = new SpaceGuardianRepository(SOON_ENV);
  private spaceBlockedRepo = new SpaceBlockedMemberRepository(SOON_ENV);
  private spaceKnockingRepo = new SpaceKnockingMemberRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.SPACE, httpClient);
  }

  public isMemberWithinSpace(spaceId: string, memberId: string): Observable<boolean> {
    if (!spaceId || !memberId) {
      return of(false);
    }
    return this.spaceMemberRepo.getByIdLive(spaceId, memberId).pipe(map((member) => !!member));
  }

  public isGuardianWithinSpace(spaceId: string, memberId: string): Observable<boolean> {
    if (!spaceId || !memberId) {
      return of(false);
    }
    return this.spaceGuardianRepo.getByIdLive(spaceId, memberId).pipe(map((member) => !!member));
  }

  public isPendingMemberWithinSpace(spaceId: string, memberId: string): Observable<boolean> {
    if (!spaceId || !memberId) {
      return of(false);
    }
    return this.spaceKnockingRepo.getByIdLive(spaceId, memberId).pipe(map((member) => !!member));
  }

  public listenGuardians = (spaceId: string, lastValue?: string) =>
    this.spaceGuardianRepo.getAllLive(spaceId, lastValue).pipe(switchMap(this.getMembers));

  public getMembersWithoutData = (spaceId: string, lastValue?: string) =>
    this.spaceMemberRepo.getAll(spaceId, lastValue);

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

  public listenMembers = (spaceId: string, lastValue?: string) =>
    this.spaceMemberRepo.getAllLive(spaceId, lastValue).pipe(switchMap(this.getMembers));

  public listenBlockedMembers = (spaceId: string, lastValue?: string) =>
    this.spaceBlockedRepo.getAllLive(spaceId, lastValue).pipe(switchMap(this.getMembers));

  public listenPendingMembers = (spaceId: string, lastValue?: string) =>
    this.spaceKnockingRepo.getAllLive(spaceId, lastValue).pipe(switchMap(this.getMembers));

  private getMembers = async (spaceMembers: SpaceMember[]) => {
    const uids = spaceMembers.map((m) => m.uid);
    const promises = chunkArray(uids, QUERY_MAX_LENGTH).map((chunk) =>
      this.memberRepo.getManyById(chunk),
    );
    return (await Promise.all(promises)).flat();
  };

  public create = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.createSpace, req);

  public save = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.updateSpace, req);

  public join = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.joinSpace, req);

  public leave = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.leaveSpace, req);

  public setGuardian = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.addGuardianSpace, req);

  public claimSpace = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.claimSpace, req);

  public removeGuardian = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.removeGuardianSpace, req);

  public blockMember = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.blockMemberSpace, req);

  public unblockMember = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.unblockMemberSpace, req);

  public acceptMember = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.acceptMemberSpace, req);

  public rejectMember = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.declineMemberSpace, req);

  public update = (req: WenRequest): Observable<Space | undefined> =>
    this.request(WEN_FUNC.updateSpace, req);
}
