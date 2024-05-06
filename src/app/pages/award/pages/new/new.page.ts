import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpaceApi } from '@api/space.api';
import { TokenApi } from '@api/token.api';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { SeoService } from '@core/services/seo';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  FILE_SIZES,
  PROD_AVAILABLE_MINTABLE_NETWORKS,
  Space,
  TEST_AVAILABLE_MINTABLE_NETWORKS,
  Token,
  TokenStatus,
  getDefDecimalIfNotSet,
  Network,
} from '@buildcore/interfaces';
import { BehaviorSubject, of, Subscription, switchMap } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AwardApi } from './../../../../@api/award.api';
import { MemberApi } from './../../../../@api/member.api';
import { NavigationService } from './../../../../@core/services/navigation/navigation.service';
import { NotificationService } from './../../../../@core/services/notification/notification.service';
import { AuthService } from './../../../../components/auth/services/auth.service';

import { FileApi } from '@api/file.api';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzUploadChangeParam, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';

@UntilDestroy()
@Component({
  selector: 'wen-new',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './new.page.html',
  styleUrls: ['./new.page.less'],
})
export class NewPage implements OnInit, OnDestroy {
  public tokenControl: FormControl = new FormControl('', Validators.required);
  public spaceControl: FormControl = new FormControl('', Validators.required);
  public nameControl: FormControl = new FormControl('', Validators.required);
  public endControl: FormControl = new FormControl('', Validators.required);
  public descriptionControl: FormControl = new FormControl('');
  public imageControl: FormControl = new FormControl('', Validators.required);
  public uploadedImage?: NzUploadFile | null;
  // Badge
  public badgeDescriptionControl: FormControl = new FormControl('');
  public badgeNameControl: FormControl = new FormControl('', Validators.required);
  public badgeTokenControl: FormControl = new FormControl('', [
    Validators.min(0),
    Validators.max(10000),
    Validators.required,
  ]);
  public badgeCountControl: FormControl = new FormControl('', [
    Validators.min(0),
    Validators.max(10000),
    Validators.required,
  ]);
  public badgeLockPeriodControl: FormControl = new FormControl('', [
    Validators.min(0),
    Validators.max(80 * 12), // 80 years.
    Validators.required,
  ]);

  public availableBaseTokens = environment.production
    ? [...PROD_AVAILABLE_MINTABLE_NETWORKS]
    : [...TEST_AVAILABLE_MINTABLE_NETWORKS];
  public awardForm: FormGroup;
  public spaces$: BehaviorSubject<Space[]> = new BehaviorSubject<Space[]>([]);
  public tokens$: BehaviorSubject<Token[]> = new BehaviorSubject<Token[]>([]);
  private subscriptions$: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private awardApi: AwardApi,
    private tokenApi: TokenApi,
    private notification: NotificationService,
    private memberApi: MemberApi,
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoService,
    private spaceApi: SpaceApi,
    public unitsService: UnitsService,
    private nzNotification: NzNotificationService,
    public nav: NavigationService,
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    private fileApi: FileApi,
  ) {
    this.awardForm = new FormGroup({
      space: this.spaceControl,
      name: this.nameControl,
      endDate: this.endControl,
      description: this.descriptionControl,
      badgeDescription: this.badgeDescriptionControl,
      badgeName: this.badgeNameControl,
      badgeToken: this.badgeTokenControl,
      badgeCount: this.badgeCountControl,
      badgeLockPeriod: this.badgeLockPeriodControl,
      image: this.imageControl,
      token: this.tokenControl,
    });
  }

  public ngOnInit(): void {
    if (
      this.nav.getLastUrl() &&
      this.nav.getLastUrl()[1] === ROUTER_UTILS.config.space.root &&
      this.nav.getLastUrl()[2]
    ) {
      this.spaceControl.setValue(this.nav.getLastUrl()[2]);
    }

    this.seo.setTags(
      $localize`Award - New`,
      $localize`Create engagement and growth for your DAOs and digital communities. Awards, fee-less voting, 1-click set up. Join today.`,
    );

    this.route.params
      ?.pipe(
        filter((p) => p.space),
        switchMap((p) => this.spaceApi.listen(p.space)),
        filter((space) => !!space),
        untilDestroyed(this),
      )
      .subscribe((space: any) => {
        this.spaceControl.setValue(space?.uid);

        this.seo.setTags(
          $localize`Award - New`,
          $localize`Create engagement and growth for your DAOs and digital communities. Awards, fee-less voting, 1-click set up. Join today.`,
          space?.bannerUrl,
        );
      });

    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((o) => {
      if (o?.uid) {
        this.subscriptions$.push(this.memberApi.allSpacesAsMember(o.uid).subscribe(this.spaces$));
      }
    });

    this.tokenApi.getAllTokens().then((tokens) => {
      this.tokens$.next(
        tokens?.filter((t) => {
          return (
            (TEST_AVAILABLE_MINTABLE_NETWORKS.indexOf(<any>t.mintingData?.network) > -1 ||
              t.status === TokenStatus.BASE) &&
            t.approved
          );
        }),
      );
    });
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public getTotalTokens(): number {
    return Number(this.badgeCountControl.value) * Number(this.badgeTokenControl.value);
  }

  public isBaseToken(token?: Token): boolean {
    return token?.status === TokenStatus.BASE;
  }

  public getCurrentToken(): Token | undefined {
    const obj: any = this.tokens$.value.find((t) => {
      return this.tokenControl.value === t.uid;
    });

    return obj;
  }

  private memberIsLoggedOut(item: NzUploadXHRArgs): Subscription {
    const err = $localize`Member seems to log out during the file upload request.`;
    this.nzNotification.error(err, '');
    if (item.onError) {
      item.onError(err, item.file);
    }

    return of(undefined).subscribe();
  }

  public uploadFileBadge(item: NzUploadXHRArgs): Subscription {
    if (!this.auth.member$.value) {
      return this.memberIsLoggedOut(item);
    }

    return this.fileApi.upload(this.auth.member$.value.uid, item);
  }

  public uploadChangeBadge(event: NzUploadChangeParam): void {
    if (event.type === 'success') {
      this.imageControl.setValue(event.file.response);
      this.uploadedImage = event.file;
    } else {
      this.imageControl.setValue('');
    }
  }

  public get networkTypes(): typeof Network {
    return Network;
  }

  private formatSubmitObj(obj: any): any {
    obj.badge = {
      description: obj.badgeDescription,
      name: obj.badgeName,
      tokenReward:
        obj.badgeToken * Math.pow(10, getDefDecimalIfNotSet(this.getCurrentToken()?.decimals)),
      total: obj.badgeCount,
      image: obj.image,
      tokenSymbol: this.getCurrentToken()?.symbol,
      lockTime: Math.floor(obj.badgeLockPeriod * (365.2425 / 12) * 24 * 60 * 60 * 1000),
    };

    obj.network = this.getCurrentToken()?.mintingData?.network;
    delete obj.image;
    delete obj.badgeDescription;
    delete obj.badgeName;
    delete obj.badgeToken;
    delete obj.badgeCount;
    delete obj.badgeLockPeriod;
    delete obj.token;
    return obj;
  }

  private validateForm(): boolean {
    this.awardForm.updateValueAndValidity();
    if (!this.awardForm.valid) {
      Object.values(this.awardForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });

      return false;
    }

    return true;
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public async create(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    await this.auth.sign(this.formatSubmitObj(this.awardForm.value), (sc, finish) => {
      this.notification
        .processRequest(this.awardApi.create(sc), 'Created.', finish)
        .subscribe((val) => {
          this.router.navigate([ROUTER_UTILS.config.award.root, val?.uid]);
        });
    });
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
