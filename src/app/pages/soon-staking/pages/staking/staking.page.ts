import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { SpaceApi } from '@api/space.api';
import { StakeRewardApi } from '@api/stake_reward';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { ThemeList, ThemeService } from '@core/services/theme';
import { UnitsService } from '@core/services/units';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  MAX_WEEKS_TO_STAKE,
  MIN_WEEKS_TO_STAKE,
  SOON_SPACE,
  SOON_SPACE_TEST,
  SOON_TOKEN,
  SOON_TOKEN_TEST,
  Space,
  StakeReward,
  StakeType,
  Token,
  TokenStats,
  calcStakedMultiplier,
  getDefDecimalIfNotSet,
} from '@build-5/interfaces';
import { BehaviorSubject, Observable, Subscription, map, merge, of } from 'rxjs';

interface Rewards {
  key: string;
  category: string;
  category_extra: string;
  level0: string;
  level1: string;
  level2: string;
  level3: string;
  level4: string;
}

@UntilDestroy()
@Component({
  selector: 'wen-staking',
  templateUrl: './staking.page.html',
  styleUrls: ['./staking.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StakingPage implements OnInit, OnDestroy {
  public theme = ThemeList;
  public weeks = Array.from({ length: 52 }, (_, i) => i + 1);
  public openTokenStake = false;
  public amountControl: FormControl = new FormControl(null, [
    Validators.required,
    Validators.min(1),
  ]);
  public weekControl: FormControl = new FormControl(1, [
    Validators.required,
    Validators.min(MIN_WEEKS_TO_STAKE),
    Validators.max(MAX_WEEKS_TO_STAKE),
  ]);

  public stakeControl: FormControl = new FormControl({ value: 0, disabled: true });
  public multiplierControl: FormControl = new FormControl({ value: 0, disabled: true });
  public earnControl: FormControl = new FormControl({ value: 0, disabled: true });
  public levelControl: FormControl = new FormControl({ value: 0, disabled: true });
  public space$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public token$: BehaviorSubject<Token | undefined> = new BehaviorSubject<Token | undefined>(
    undefined,
  );
  public stakeRewards$: BehaviorSubject<StakeReward[] | undefined> = new BehaviorSubject<
    StakeReward[] | undefined
  >(undefined);
  public tokenStats$: BehaviorSubject<TokenStats | undefined> = new BehaviorSubject<
    TokenStats | undefined
  >(undefined);
  private subscriptions$: Subscription[] = [];
  constructor(
    public themeService: ThemeService,
    private cd: ChangeDetectorRef,
    private spaceApi: SpaceApi,
    private tokenApi: TokenApi,
    private stakeRewardsApi: StakeRewardApi,
    public previewImageService: PreviewImageService,
    public unitService: UnitsService,
    private auth: AuthService,
    public deviceService: DeviceService,
  ) {}

  public get themes(): typeof ThemeList {
    return ThemeList;
  }

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(false);

    // We don't want calc to be automatic.
    merge(this.amountControl.valueChanges, this.weekControl.valueChanges)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.calcStake();
      });

    this.listenToSpace(environment.production ? SOON_SPACE : SOON_SPACE_TEST);
    this.listenToToken(environment.production ? SOON_TOKEN : SOON_TOKEN_TEST);
    this.listenToTokenStatus(environment.production ? SOON_TOKEN : SOON_TOKEN_TEST);
    this.listenToTokenRewards(environment.production ? SOON_TOKEN : SOON_TOKEN_TEST);
  }

  public calcStake(): void {
    if ((this.amountControl.value || 0) > 0 && (this.weekControl.value || 0) > 0) {
      const val = calcStakedMultiplier(this.weekControl.value) * (this.amountControl.value || 0);
      this.stakeControl.setValue(val.toFixed(2));
      const newTotal =
        (this.auth.memberSoonDistribution$.value?.stakes?.[StakeType.DYNAMIC]?.value || 0) +
        Math.pow(10, getDefDecimalIfNotSet(this.token$.value?.decimals)) * val;
      let l = -1;
      environment.tiers.forEach((a) => {
        if (newTotal >= a) {
          l++;
        }
      });

      if (l > environment.tiers.length) {
        l = environment.tiers.length;
      }

      this.levelControl.setValue(l);
      this.multiplierControl.setValue(calcStakedMultiplier(this.weekControl.value));
      if (this.tokenStats$.value && this.stakeRewards$.value) {
        this.earnControl.setValue(
          this.stakeRewardsApi.calcApy(
            this.tokenStats$.value,
            this.stakeControl.value *
              Math.pow(10, getDefDecimalIfNotSet(this.token$.value?.decimals)),
            this.stakeRewards$.value,
          ),
        );
      }
      this.cd.markForCheck();
    } else {
      this.stakeControl.setValue(0);
      this.multiplierControl.setValue(0);
      this.earnControl.setValue(0);
    }
  }

  public isSoonSpace(): Observable<boolean> {
    return this.space$.pipe(
      map((s) => {
        return s?.uid === (environment.production ? SOON_SPACE : SOON_SPACE_TEST);
      }),
    );
  }

  public listenToSpace(id: string): void {
    this.subscriptions$.push(this.spaceApi.listen(id).subscribe(this.space$));
  }

  public listenToToken(id: string): void {
    this.subscriptions$.push(this.tokenApi.listen(id).subscribe(this.token$));
  }

  public listenToTokenStatus(token: string): void {
    this.subscriptions$.push(this.tokenApi.stats(token).subscribe(this.tokenStats$));
  }

  public listenToTokenRewards(token: string): void {
    this.subscriptions$.push(
      this.stakeRewardsApi.token(token, undefined).subscribe(this.stakeRewards$),
    );
  }

  public getLevelClass(level: number): Observable<'selected-column' | 'selected-column-cur' | ''> {
    if (level === 0) {
      return of('');
    }

    if (this.levelControl.value === level && this.amountControl.value > 0) {
      return of('selected-column');
    } else if (
      this.auth.memberLevel$.value === level &&
      (this.auth.memberSoonDistribution$.value?.stakes?.[StakeType.DYNAMIC]?.value || 0) > 0 &&
      !this.amountControl.value
    ) {
      return of('selected-column-cur');
    } else {
      return of('');
    }
  }

  public pInt(v: string): number {
    return parseInt(v);
  }

  public listOfData: Rewards[] = [
    {
      key: '1',
      category: 'Requirements',
      category_extra: 'Staked value', // auth.memberLevel$ | async
      level0: environment.tiers[0].toString(),
      level1: environment.tiers[1].toString(),
      level2: environment.tiers[2].toString(),
      level3: environment.tiers[3].toString(),
      level4: environment.tiers[4].toString(),
    },
    {
      key: '2',
      category: 'Rewards',
      category_extra: '',
      level0: '0',
      level1: '✓',
      level2: '✓',
      level3: '✓',
      level4: '✓',
    },
    {
      key: '3',
      category: 'Token Trading Discounts',
      category_extra: '',
      level0: '0',
      level1: '25%',
      level2: '50%',
      level3: '75%',
      level4: '100%',
    },
    {
      key: '4',
      category: 'Extra Features',
      category_extra: 'Create Collections',
      level0: '-',
      level1: '✓',
      level2: '✓',
      level3: '✓',
      level4: '✓',
    },
    {
      key: '5',
      category: '',
      category_extra: 'Create Token',
      level0: '-',
      level1: '✓',
      level2: '✓',
      level3: '✓',
      level4: '✓',
    },
    {
      key: '6',
      category: '',
      category_extra: 'Up/Down Vote',
      level0: '-',
      level1: '✓',
      level2: '✓',
      level3: '✓',
      level4: '✓',
    },
  ];

  public submit(): void {
    this.openTokenStake = true;
    this.cd.markForCheck();
  }

  public cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
