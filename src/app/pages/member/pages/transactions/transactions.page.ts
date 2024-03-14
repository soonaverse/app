import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DEFAULT_LIST_SIZE } from '@api/base.api';
import { MemberApi } from '@api/member.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { download } from '@core/utils/tools.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/member/services/data.service';
import { HelperService } from '@pages/member/services/helper.service';
import { Member, Transaction, TransactionType } from '@build-5/interfaces';
import Papa from 'papaparse';
import { BehaviorSubject, Observable, Subscription, first, map, of, toArray } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-transactions',
  templateUrl: './transactions.page.html',
  styleUrls: ['./transactions.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionsPage implements OnInit, OnDestroy {
  public transactions$: BehaviorSubject<Transaction[] | undefined> = new BehaviorSubject<
    Transaction[] | undefined
  >(undefined);
  public exportingTransactions = false;
  public openLockedTokenClaim?: Transaction | null;
  private dataStore: Transaction[][] = [];
  private subscriptions$: Subscription[] = [];

  constructor(
    public deviceService: DeviceService,
    public transactionService: TransactionService,
    public helper: HelperService,
    public unitsService: UnitsService,
    public data: DataService,
    private auth: AuthService,
    private memberApi: MemberApi,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
  ) {}

  public ngOnInit(): void {
    this.route.params.subscribe((params) => {
      if (params?.export === 'true' || params?.export === true) {
        this.exportTransactions();
        this.cd.markForCheck();
      }

      this.data.member$?.pipe(untilDestroyed(this)).subscribe((obj) => {
        if (obj) {
          this.listen();
        }
      });
    });
  }

  public getDebugInfo(tran: Transaction | undefined | null): string {
    let msg = `uid: ${tran?.uid}, tries: ${tran?.payload?.walletReference?.count || 0}`;
    if (tran?.payload?.walletReference?.error) {
      msg += `, error: "${tran?.payload?.walletReference?.error}"`;
    }

    return msg;
  }

  private listen(): void {
    this.cancelSubscriptions();
    this.transactions$.next(undefined);
    this.subscriptions$.push(this.getHandler(undefined).subscribe(this.store.bind(this, 0)));
  }

  public isLoading(arr: any): boolean {
    return arr === undefined;
  }

  public get loggedInMember$(): BehaviorSubject<Member | undefined> {
    return this.auth.member$;
  }

  public isEmpty(arr: any): boolean {
    return Array.isArray(arr) && arr.length === 0;
  }

  public isNotVote(type: TransactionType): boolean {
    return type !== TransactionType.VOTE;
  }

  public claimLocked(transaction: Transaction): void {
    this.openLockedTokenClaim = transaction;
    this.cd.markForCheck();
  }

  public getHandler(last?: any): Observable<Transaction[]> {
    if (this.data.member$.value) {
      return this.memberApi.topTransactions(this.data.member$.value.uid, undefined, last);
    } else {
      return of([]);
    }
  }

  public onScroll(): void {
    // In this case there is no value, no need to infinite scroll.
    if (!this.transactions$.value) {
      return;
    }

    // We reached maximum.
    if (
      !this.dataStore[this.dataStore.length - 1] ||
      this.dataStore[this.dataStore.length - 1]?.length < DEFAULT_LIST_SIZE
    ) {
      return;
    }

    // Def order field.
    const lastValue = this.transactions$.value[this.transactions$.value.length - 1]._doc;
    this.subscriptions$.push(
      this.getHandler(lastValue).subscribe(this.store.bind(this, this.dataStore.length)),
    );
  }

  protected store(page: number, a: any): void {
    if (this.dataStore[page]) {
      this.dataStore[page] = a;
    } else {
      this.dataStore.push(a);
    }

    // Merge arrays.
    this.transactions$.next(Array.prototype.concat.apply([], this.dataStore));
  }

  public get maxRecords$(): BehaviorSubject<boolean> {
    return <BehaviorSubject<boolean>>this.transactions$.pipe(
      map(() => {
        if (!this.dataStore[this.dataStore.length - 1]) {
          return true;
        }

        return (
          !this.dataStore[this.dataStore.length - 1] ||
          this.dataStore[this.dataStore.length - 1]?.length < DEFAULT_LIST_SIZE
        );
      }),
    );
  }

  public exportTransactions(): void {
    if (!this.data.member$.value?.uid) return;
    this.exportingTransactions = true;

    this.memberApi
      .getAllTransactions(this.data.member$.value?.uid)
      .pipe(toArray(), untilDestroyed(this))
      .subscribe({
        next: (allTransactions: Transaction[][]) => {
          this.exportingTransactions = false;
          const flatTransactions = allTransactions.flat();
          const fields = [
            'tranUid',
            'network',
            'type',
            'date',
            'amount',
            'tokenAmount',
            'tokenId',
            'tokenUid',
            'nftUid',
            'collectionUid',
            'tangle',
          ];
          const csv = Papa.unparse({
            fields,
            data: flatTransactions.map(t => [
              t.uid,
              t.network,
              this.transactionService.getTitle(t),
              t.createdOn?.toDate(),
              t.payload.amount,
              t.payload.nativeTokens?.[0]?.amount || '',
              t.payload.nativeTokens?.[0]?.id || '',
              t.payload.token,
              t.payload.nft,
              t.payload.collection,
              this.transactionService.getExplorerLink(t),
            ]),
          });

          download(
            `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`,
            `soonaverse_${this.data.member$.value?.uid}_transactions.csv`
          );
          this.cd.markForCheck();
        },
        error: (error) => {
          this.exportingTransactions = false;
          console.error('Error fetching transactions for export', error);

        }
      });
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });

    this.dataStore = [];
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
