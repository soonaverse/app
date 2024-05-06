import { Injectable } from '@angular/core';
import {
  Award,
  Member,
  Proposal,
  ProposalAnswer,
  Space,
  SpaceGuardian,
  Token,
  TokenDistribution,
  Transaction,
} from '@buildcore/interfaces';
import { BehaviorSubject } from 'rxjs';
import { TransactionWithFullMember } from './../../../@api/proposal.api';

@Injectable({
  providedIn: 'any',
})
export class DataService {
  public proposal$: BehaviorSubject<Proposal | undefined> = new BehaviorSubject<
    Proposal | undefined
  >(undefined);
  public space$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public token$: BehaviorSubject<Token | undefined> = new BehaviorSubject<Token | undefined>(
    undefined,
  );
  public badges$: BehaviorSubject<Award[] | undefined> = new BehaviorSubject<Award[] | undefined>(
    undefined,
  );
  public creator$: BehaviorSubject<Member | undefined> = new BehaviorSubject<Member | undefined>(
    undefined,
  );
  public transactions$: BehaviorSubject<TransactionWithFullMember[] | undefined> =
    new BehaviorSubject<TransactionWithFullMember[] | undefined>(undefined);
  public currentMembersVotes$: BehaviorSubject<Transaction[] | undefined> = new BehaviorSubject<
    Transaction[] | undefined
  >(undefined);
  public canVote$: BehaviorSubject<boolean | undefined> = new BehaviorSubject<boolean | undefined>(
    false,
  );
  public guardians$: BehaviorSubject<SpaceGuardian[] | undefined> = new BehaviorSubject<
    SpaceGuardian[] | undefined
  >(undefined);
  public tokenDistribution$: BehaviorSubject<TokenDistribution | undefined> = new BehaviorSubject<
    TokenDistribution | undefined
  >(undefined);

  constructor() {
    // none.
  }

  public resetSubjects(): void {
    // Clean up all streams.
    this.proposal$.next(undefined);
    this.space$.next(undefined);
    this.badges$.next(undefined);
    this.creator$.next(undefined);
    this.transactions$.next(undefined);
    this.guardians$.next(undefined);
    this.canVote$.next(false);
  }

  public isLoading(arr: any): boolean {
    return arr === undefined;
  }

  public isEmpty(arr: any): boolean {
    return Array.isArray(arr) && arr.length === 0;
  }

  public getProgress(proposal: Proposal | null | undefined, a: ProposalAnswer): number {
    let total = 0;
    if (proposal?.results?.answers) {
      Object.keys(proposal?.results?.answers).forEach((b: any) => {
        total += proposal?.results?.answers[b] || 0;
      });
    }

    return ((proposal?.results?.answers?.[a.value] || 0) / total) * 100;
  }
}
