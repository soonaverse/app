import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
import { BehaviorSubject, Observable, filter, finalize, first } from 'rxjs';

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
  public allTransactions: Transaction[] = [];
  public isLoadingTransactions$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(true);
  public selectedTransactionCount = '100';
  public transactionOptions = ['100', '200', '500', 'ALL'];
  public lastTransactionId: string | null = null;
  public likelyAllFetched$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

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
      }
    });

    this.isLoadingTransactions$.next(true);
    this.data.member$
      .pipe(
        filter((member) => !!member),
        first(),
        untilDestroyed(this),
      )
      .subscribe((member) => {
        this.isLoadingTransactions$.next(false);
        this.fetchTransactionsForDisplay();
      });
  }

  public fetchTransactionsForDisplay(): void {
    this.isLoadingTransactions$.next(true);
    const memberUid = this.data.member$.value?.uid;

    if (memberUid) {
      if (this.selectedTransactionCount === 'ALL') {
        this.allTransactions = [];
      }

      let transactionsObservable: Observable<Transaction[]>;
      if (this.selectedTransactionCount === 'ALL') {
        transactionsObservable = this.memberApi.getAllTransactions(memberUid, ['createdOn']);
        this.likelyAllFetched$.next(true);
      } else {
        const limit = parseInt(this.selectedTransactionCount);
        transactionsObservable = this.memberApi.getTransactionsWithLimit(memberUid, limit, [
          'createdOn',
        ]);
      }

      transactionsObservable
        .pipe(
          finalize(() => {
            this.isLoadingTransactions$.next(false);
            this.cd.markForCheck();
          }),
          untilDestroyed(this),
        )
        .subscribe((transactions) => {
          this.transactions$.next(transactions);
          if (this.selectedTransactionCount === 'ALL') {
            this.allTransactions = transactions;
          } else {
            this.likelyAllFetched$.next(
              transactions.length < parseInt(this.selectedTransactionCount) ||
                transactions.length === this.allTransactions.length,
            );
          }
        });
    }
  }

  public getDebugInfo(tran: Transaction | undefined | null): string {
    let msg = `uid: ${tran?.uid}, tries: ${tran?.payload?.walletReference?.count || 0}`;
    if (tran?.payload?.walletReference?.error) {
      msg += `, error: "${tran?.payload?.walletReference?.error}"`;
    }

    return msg;
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

  public onScroll(): void {
    if (
      this.deviceService.isMobile$ &&
      this.transactions$.value &&
      this.transactions$.value.length > 0
    ) {
      this.isLoadingTransactions$.pipe(first()).subscribe((isLoading) => {
        if (!isLoading) {
          this.isLoadingTransactions$.next(true);
          const memberUid = this.data.member$.value?.uid;

          if (memberUid && this.lastTransactionId) {
            this.memberApi
              .topTransactions(memberUid, ['createdOn'], this.lastTransactionId)
              .pipe(
                first(),
                finalize(() => this.isLoadingTransactions$.next(false)),
              )
              .subscribe((transactions) => {
                if (transactions && transactions.length > 0) {
                  this.transactions$.next([...(this.transactions$.value || []), ...transactions]);
                  this.lastTransactionId = transactions[transactions.length - 1].uid;
                }
                this.cd.markForCheck();
              });
          }
        }
      });
    }
  }

  public exportTransactions(): void {
    if (!this.data.member$.value?.uid) return;
    this.exportingTransactions = true;

    this.transactions$.pipe(first()).subscribe((transactions) => {
      if (transactions && transactions.length > 0) {
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
          data: transactions.map((t) => [
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

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const downloadUrl = URL.createObjectURL(blob);
        download(downloadUrl, `soonaverse_${this.data.member$.value?.uid}_transactions.csv`);
        URL.revokeObjectURL(downloadUrl);
      } else {
        console.error('No transactions to export');
      }
      this.exportingTransactions = false;
      this.cd.markForCheck();
    });
  }

  public trackByUid(index: number, item: any): any {
    return item ? item.uid : index;
  }

  private cancelSubscriptions(): void {
    this.transactions$.unsubscribe();
    this.likelyAllFetched$.unsubscribe();
    this.isLoadingTransactions$.unsubscribe();
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
