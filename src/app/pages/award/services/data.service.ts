import { Injectable } from '@angular/core';
import { AwardParticipantWithMember } from '@api/award.api';
import { Award, Member, Space, Token } from '@soonaverse/interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'any',
})
export class DataService {
  public award$: BehaviorSubject<Award | undefined> = new BehaviorSubject<Award | undefined>(
    undefined,
  );
  public space$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public token$: BehaviorSubject<Token | undefined> = new BehaviorSubject<Token | undefined>(
    undefined,
  );
  public owners$: BehaviorSubject<Member[] | undefined> = new BehaviorSubject<Member[] | undefined>(
    undefined,
  );
  public isGuardianWithinSpace$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isParticipantWithinAward$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  public isLoading(arr: AwardParticipantWithMember[] | null | undefined): boolean {
    return arr === undefined;
  }

  public isEmpty(arr: AwardParticipantWithMember[] | null | undefined): boolean {
    return Array.isArray(arr) && arr.length === 0;
  }

  public resetSubjects(): void {
    // Clean up all streams.
    this.award$.next(undefined);
    this.space$.next(undefined);
    this.owners$.next(undefined);
    this.isGuardianWithinSpace$.next(false);
    this.isParticipantWithinAward$.next(false);
  }
}
