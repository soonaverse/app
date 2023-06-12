import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AwardApi } from '@api/award.api';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { download } from '@core/utils/tools.utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Award, StakeRewardStatus } from '@build-5/interfaces';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import Papa from 'papaparse';
import { Observable } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-award-give-badges',
  templateUrl: './award-give-badges.component.html',
  styleUrls: ['./award-give-badges.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwardGiveBadgesComponent {
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() award?: Award;
  @Output() wenOnClose = new EventEmitter<void>();
  public uploadStage = 0;
  public badgesToGive: any = [];
  public tableConfig = [{ label: `address`, key: 'address' }];
  private _isOpen = false;

  constructor(
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private notification: NotificationService,
    private awardApi: AwardApi,
  ) {}

  public beforeCSVUpload(file: NzUploadFile): boolean | Observable<boolean> {
    if (!file) return false;

    Papa.parse(file as unknown as File, {
      skipEmptyLines: true,
      header: true,
      complete: (results: any) => {
        if (!results?.data?.length) {
          return;
        }

        this.badgesToGive = results.data.map((v: any) => {
          return {
            address: v.address,
          };
        });
        this.uploadStage = 1;
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
    if (!this.badgesToGive?.length || !this.award?.uid) {
      this.reset();
      return;
    }

    await this.auth.sign(
      {
        award: this.award!.uid,
        members: this.badgesToGive.map((o: any) => {
          return o.address;
        }),
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.awardApi.approveParticipant(sc), $localize`Submitted.`, finish)
          .subscribe(() => {
            this.close();
          });
      },
    );
  }

  public get rewardScheduleStatuses(): typeof StakeRewardStatus {
    return StakeRewardStatus;
  }

  public close(): void {
    this.reset();
    this.badgesToGive = [];
    this.uploadStage = 0;
    this.wenOnClose.next();
  }

  public reset(): void {
    this.isOpen = false;
    this.badgesToGive = [];
    this.uploadStage = 0;
    this.cd.markForCheck();
  }
}
