import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { GLOBAL_DEBOUNCE_TIME, Transaction } from '@build-5/interfaces';
import { BehaviorSubject, debounceTime, map } from 'rxjs';
import { ThemeList, ThemeService } from '@core/services/theme';
import { DataService } from './../../services/data.service';

interface TokensBreakdown {
  uid: string;
  totalTokenRewards: number;
  completedAwards: number;
}

interface DetailedList {
  spaceUid: string;
  rewards: TokensBreakdown[];
}
@UntilDestroy()
@Component({
  selector: 'wen-badges',
  templateUrl: './badges.page.html',
  styleUrls: ['./badges.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgesPage implements OnInit {
  public detailedReputationList$: BehaviorSubject<DetailedList[]> = new BehaviorSubject<
    DetailedList[]
  >([]);
  public totalReputationList$: BehaviorSubject<TokensBreakdown[]> = new BehaviorSubject<
    TokensBreakdown[]
  >([]);
  public theme = ThemeList;
  constructor(
    private auth: AuthService,
    public cache: CacheService,
    public data: DataService,
    public unitsService: UnitsService,
    public previewImageService: PreviewImageService,
    public deviceService: DeviceService,
    public themeService: ThemeService,
  ) {
    // none.
  }

  public get themes(): typeof ThemeList {
    return ThemeList;
  }

  public ngOnInit(): void {
    this.data.member$
      .pipe(
        map((member) => {
          const output: DetailedList[] = [];
          for (const s in member?.spaces || {}) {
            if (Object.prototype.hasOwnProperty.call(member!.spaces, s)) {
              const rec = member!.spaces![s];
              const out: DetailedList = {
                spaceUid: s,
                rewards: [],
              };

              for (const t in rec.awardStat) {
                if (Object.prototype.hasOwnProperty.call(rec.awardStat, t)) {
                  out.rewards.push({
                    totalTokenRewards: rec.awardStat[t].totalReward || 0,
                    completedAwards: rec.awardStat[t].completed || 0,
                    uid: t,
                  });
                }
              }

              output.push(out);
            }
          }

          return output;
        }),
        untilDestroyed(this),
        debounceTime(GLOBAL_DEBOUNCE_TIME),
      )
      .subscribe(this.detailedReputationList$);

    this.data.member$
      .pipe(
        map((member) => {
          const output: TokensBreakdown[] = [];
          for (const s in member?.spaces || {}) {
            if (Object.prototype.hasOwnProperty.call(member!.spaces, s)) {
              const rec = member!.spaces![s];
              for (const t in rec.awardStat) {
                if (Object.prototype.hasOwnProperty.call(rec.awardStat, t)) {
                  const recExists = output.find((tes) => {
                    return tes.uid === t;
                  });
                  if (recExists) {
                    recExists.totalTokenRewards += rec.awardStat[t].totalReward || 0;
                    recExists.completedAwards += rec.awardStat[t].completed || 0;
                  } else {
                    output.push({
                      totalTokenRewards: rec.awardStat[t].totalReward || 0,
                      completedAwards: rec.awardStat[t].completed || 0,
                      uid: t,
                    });
                  }
                }
              }
            }
          }

          return output;
        }),
        untilDestroyed(this),
        debounceTime(GLOBAL_DEBOUNCE_TIME),
      )
      .subscribe(this.totalReputationList$);
  }

  public get isLoggedIn$(): BehaviorSubject<boolean> {
    return this.auth.isLoggedIn$;
  }

  public trackByUid(index: number, item: any): any {
    return item ? item.uid : index;
  }

}
