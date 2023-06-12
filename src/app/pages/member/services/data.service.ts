import { Injectable } from '@angular/core';
import { MemberApi } from '@api/member.api';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Award, Member, Space, Transaction } from '@build-5/interfaces';
import { BehaviorSubject, Subscription } from 'rxjs';
import {
  AuditOneQueryService,
  AuditOneResponseMember,
} from 'src/app/service-modules/audit-one/services/query.service';
import { TransactionApi } from './../../../@api/transaction.api';

export enum MemberAction {
  EDIT = 'edit',
  MANAGE_ADDRESSES = 'manage_addresses',
}

@UntilDestroy()
@Injectable({
  providedIn: 'any',
})
export class DataService {
  public member$: BehaviorSubject<Member | undefined> = new BehaviorSubject<Member | undefined>(
    undefined,
  );
  public awardsCompleted$: BehaviorSubject<Award[] | undefined> = new BehaviorSubject<
    Award[] | undefined
  >(undefined);
  public awardsPending$: BehaviorSubject<Award[] | undefined> = new BehaviorSubject<
    Award[] | undefined
  >(undefined);
  public badges$: BehaviorSubject<Transaction[] | undefined> = new BehaviorSubject<
    Transaction[] | undefined
  >(undefined);
  public space$: BehaviorSubject<Space[] | undefined> = new BehaviorSubject<Space[] | undefined>(
    undefined,
  );
  public triggerAction$: BehaviorSubject<MemberAction | undefined> = new BehaviorSubject<
    MemberAction | undefined
  >(undefined);

  public auditOneStatus$: BehaviorSubject<AuditOneResponseMember | undefined> = new BehaviorSubject<
    AuditOneResponseMember | undefined
  >(undefined);

  public lastLoadedMemberId?: string;
  public subscriptions$: Subscription[] = [];

  constructor(
    private memberApi: MemberApi,
    private tranApi: TransactionApi,
    private auditOneModule: AuditOneQueryService,
  ) {
    // none.
  }

  public async loadServiceModuleData(): Promise<void> {
    // Audit One widget.
    if (this.member$.value?.uid) {
      const member = await this.auditOneModule.getMemberStatus(this.member$.value?.uid);
      this.auditOneStatus$.next(member);
    }
  }

  public async refreshBadges(): Promise<void> {
    this.cancelSubscriptions();
    if (this.member$.value?.uid) {
      // Already loaded. Do nothing. Reduce network requests.
      if (this.lastLoadedMemberId === this.member$.value.uid) {
        return;
      }

      this.lastLoadedMemberId = this.member$.value.uid;
      this.subscriptions$.push(
        this.memberApi
          .topBadges(this.member$.value.uid, 'createdOn', undefined)
          .pipe(untilDestroyed(this))
          .subscribe(this.badges$),
      );
    }
  }

  public resetSubjects(): void {
    // Clean up all streams.
    this.member$.next(undefined);
    this.awardsCompleted$.next(undefined);
    this.awardsPending$.next(undefined);
    this.badges$.next(undefined);
    this.space$.next(undefined);
    this.auditOneStatus$.next(undefined);
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }
}
