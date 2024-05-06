import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { download } from '@core/utils/tools.utils';
import { DataService } from '@pages/token/services/data.service';
import { MAX_TOTAL_TOKEN_SUPPLY, StakeType, getDefDecimalIfNotSet } from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import Papa from 'papaparse';
import { Observable } from 'rxjs';

export enum StepType {
  GENERATE = 'Generate',
  SUBMIT = 'Submit',
}

export interface AirdropItem {
  address: string;
  amount: string;
  vestingAt: dayjs.Dayjs;
  stakeType: StakeType;
}

@Component({
  selector: 'wen-airdrops',
  templateUrl: './airdrops.page.html',
  styleUrls: ['./airdrops.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AirdropsPage {
  public tableConfig = [
    { label: `Address`, key: 'address' },
    { label: `Amount`, key: 'amount' },
    { label: `StakeType`, key: 'stakeType' },
    { label: `VestingAt`, key: 'vestingAt' },
  ];
  public errors: string[] = [];
  public airdropData: AirdropItem[] = [];
  public fileName: string | null = null;
  public isAirdropModalOpen = false;

  constructor(
    public data: DataService,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private notification: NotificationService,
    private router: Router,
    private tokenApi: TokenApi,
  ) {}

  public beforeCSVUpload(file: NzUploadFile): boolean | Observable<boolean> {
    if (!file) return false;
    this.errors = [];
    Papa.parse(file as unknown as File, {
      skipEmptyLines: true,
      complete: (results: any) => {
        try {
          this.fileName = file.name;
          this.airdropData = results.data
            .slice(1)
            .filter((r: string[]) => {
              if (
                r.length === this.tableConfig.length &&
                !isNaN(Number(r[1])) &&
                Number(r[1]) <= MAX_TOTAL_TOKEN_SUPPLY
              ) {
                return true;
              }
              this.errors.push(r[0] + $localize` row is not valid`);
              return false;
            })
            .map((r: string[]) =>
              this.tableConfig
                .map((c, index) => ({ [c.key]: r[index] }))
                .reduce((acc, e) => ({ ...acc, ...e }), {}),
            );
        } catch (err) {
          console.log('Error while parsing CSV file', err);
          this.fileName = null;
          this.airdropData = [];
        }
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

  public formatSubmitData(): any {
    return {
      token: this.data.token$.value?.uid,
      drops: this.airdropData.map((r) => ({
        recipient: r.address,
        count: Math.floor(
          Number(r.amount) * Math.pow(10, getDefDecimalIfNotSet(this.data.token$.value?.decimals)),
        ),
        vestingAt: dayjs(r.vestingAt).toISOString(),
        stakeType: r.stakeType ? r.stakeType.toLocaleLowerCase() : StakeType.STATIC,
      })),
    };
  }

  public async submit(): Promise<void> {
    if (!this.airdropData.length) return;

    if (this.data.token$.value?.mintingData) {
      this.isAirdropModalOpen = true;
      this.cd.markForCheck();
      return;
    }

    await this.auth.sign(this.formatSubmitData(), (sc, finish) => {
      this.notification
        .processRequest(this.tokenApi.airdropToken(sc), 'Submitted.', finish)
        .subscribe(() => {
          this.router.navigate(['/', ROUTER_UTILS.config.token.root, this.data.token$.value?.uid]);
        });
    });
  }
}
