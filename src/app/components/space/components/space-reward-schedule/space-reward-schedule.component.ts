import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { StakeRewardApi } from '@api/stake_reward';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { download } from '@core/utils/tools.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Space,
  StakeReward,
  StakeRewardStatus,
  Token,
  getDefDecimalIfNotSet,
} from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import Papa from 'papaparse';
import { BehaviorSubject, Observable, map } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-space-reward-schedule',
  templateUrl: './space-reward-schedule.component.html',
  styleUrls: ['./space-reward-schedule.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceRewardScheduleComponent implements OnInit {
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() token?: Token;
  @Input() isGuardian?: boolean = false;
  @Input() space?: Space;
  @Output() wenOnClose = new EventEmitter<void>();
  public rewardsToUpload: any = [];
  public stakeRewards$: BehaviorSubject<StakeReward[] | undefined> = new BehaviorSubject<
    StakeReward[] | undefined
  >(undefined);
  public uploadStage = 0;
  public tableConfig = [
    { label: `StartDate`, key: 'startDate' },
    { label: `EndDate`, key: 'endDate' },
    { label: `TokenVestingDate`, key: 'tokenVestingDate' },
    { label: `TokensToDistribute`, key: 'tokensToDistribute' },
  ];
  private _isOpen = false;

  constructor(
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private notification: NotificationService,
    private stakeRewardApi: StakeRewardApi,
  ) {}

  public ngOnInit(): void {
    // Load schedule.
    this.stakeRewardApi
      .token(this.token!.uid, undefined)
      .pipe(
        untilDestroyed(this),
        map((o) => {
          return o?.sort((a, b) => a.startDate.toMillis() - b.startDate.toMillis());
        }),
      )
      .subscribe(this.stakeRewards$);
  }

  public beforeCSVUpload(file: NzUploadFile): boolean | Observable<boolean> {
    if (!file) return false;

    Papa.parse(file as unknown as File, {
      skipEmptyLines: true,
      header: true,
      complete: (results: any) => {
        if (!results?.data?.length) {
          return;
        }

        this.rewardsToUpload = results.data.map((v: any) => {
          return {
            startDate: dayjs(v.StartDate),
            endDate: dayjs(v.EndDate),
            tokenVestingDate: dayjs(v.TokenVestingDate),
            tokensToDistribute:
              v.TokensToDistribute * Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals)),
          };
        });
        this.uploadStage = 2;
        this.cd.markForCheck();
      },
    });

    return false;
  }

  public generateTemplate(): void {
    const fields = ['', ...this.tableConfig.map((r) => r.label)] as string[];

    const csv = Papa.unparse({
      fields,
      data: [],
    });

    download(`data:text/csv;charset=utf-8${csv}`, 'soonaverse_airdrop_template.csv');
  }

  public async submit(): Promise<void> {
    if (!this.rewardsToUpload?.length || !this.token?.uid) {
      this.reset();
      return;
    }

    await this.auth.sign(
      {
        token: this.token!.uid,
        items: this.rewardsToUpload.map((o: any) => {
          return {
            startDate: o.startDate.valueOf(),
            endDate: o.endDate.valueOf(),
            tokenVestingDate: o.tokenVestingDate.valueOf(),
            tokensToDistribute: o.tokensToDistribute,
          };
        }),
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.stakeRewardApi.submit(sc), $localize`Submitted.`, finish)
          .subscribe(() => {
            this.close();
          });
      },
    );
  }

  public async remove(id: string): Promise<void> {
    await this.auth.sign(
      {
        stakeRewardIds: [id],
      },
      (sc, finish) => {
        this.notification
          .processRequest(
            this.stakeRewardApi.remove(sc),
            $localize`Proposal created to remove the reward.`,
            finish,
          )
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public get rewardScheduleStatuses(): typeof StakeRewardStatus {
    return StakeRewardStatus;
  }

  public close(): void {
    this.reset();
    this.rewardsToUpload = [];
    this.uploadStage = 0;
    this.wenOnClose.next();
  }

  public reset(): void {
    this.isOpen = false;
    this.rewardsToUpload = [];
    this.uploadStage = 0;
    this.cd.markForCheck();
  }
}
