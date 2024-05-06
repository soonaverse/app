import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { Router } from '@angular/router';
import { MemberApi } from '@api/member.api';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NewService } from '@pages/token/services/new.service';
import { Access, TokenAllocation, getDefDecimalIfNotSet } from '@buildcore/interfaces';

export enum StepType {
  INTRODUCTION = 'Introduction',
  METRICS = 'Metrics',
  OVERVIEW = 'Overview',
  SUMMARY = 'Summary',
}

@UntilDestroy()
@Component({
  selector: 'wen-new',
  templateUrl: './new.page.html',
  styleUrls: ['./new.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPage implements OnInit {
  public currentStep = StepType.INTRODUCTION;
  public sections = [
    { step: StepType.INTRODUCTION, label: $localize`Introduction` },
    { step: StepType.METRICS, label: $localize`Metrics` },
    { step: StepType.OVERVIEW, label: $localize`Overview` },
    { step: StepType.SUMMARY, label: $localize`Summary` },
  ];

  public controlToStepMap: Map<AbstractControl, StepType> = new Map([
    [this.newService.nameControl, StepType.METRICS],
    [this.newService.symbolControl, StepType.METRICS],
    [this.newService.priceControl, StepType.METRICS],
    [this.newService.totalSupplyControl, StepType.METRICS],
    [this.newService.spaceControl, StepType.METRICS],
    [this.newService.iconControl, StepType.METRICS],
    [this.newService.termsAndConditionsLinkControl, StepType.METRICS],
    [this.newService.distributionControl, StepType.OVERVIEW],
    [this.newService.titleControl, StepType.OVERVIEW],
    [this.newService.descriptionControl, StepType.OVERVIEW],
    [this.newService.shortTitleControl, StepType.OVERVIEW],
    [this.newService.shortDescriptionControl, StepType.OVERVIEW],
  ]);

  public arrayToStepMap: Map<AbstractControl, StepType> = new Map([
    [this.newService.allocations, StepType.METRICS],
    [this.newService.links, StepType.OVERVIEW],
  ]);

  constructor(
    public deviceService: DeviceService,
    public newService: NewService,
    private notification: NotificationService,
    private auth: AuthService,
    private memberApi: MemberApi,
    private tokenApi: TokenApi,
    private router: Router,
    private cd: ChangeDetectorRef,
    private seo: SeoService,
  ) {}

  public ngOnInit(): void {
    this.seo.setTags(
      $localize`New Token`,
      $localize`Start your own crypto project on the secure, fee-less Shimmer network. Create your token today.`,
    );

    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((o) => {
      if (o?.uid) {
        this.memberApi
          .allSpacesAsMember(o.uid)
          .pipe(untilDestroyed(this))
          .subscribe((r) => {
            this.newService.spaces$.next(r);
          });
      }
    });
  }

  public get stepTypes(): typeof StepType {
    return StepType;
  }

  private validateForm(): boolean {
    this.newService.tokenForm.updateValueAndValidity();
    if (!this.newService.tokenForm.valid) {
      Object.values(this.newService.tokenForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
          this.currentStep =
            this.controlToStepMap.get(control) ||
            this.arrayToStepMap.get(control) ||
            this.currentStep;
          this.cd.markForCheck();
          return;
        }
      });
      return false;
    }
    const total = (this.newService.allocations.value as TokenAllocation[]).reduce(
      (acc, act) => acc + Number(act.percentage),
      0,
    );
    const publicSales = (this.newService.allocations.value as TokenAllocation[]).filter(
      (a) => a.isPublicSale,
    );
    if (total !== 100 && publicSales.length > 1) {
      this.currentStep = StepType.METRICS;
      this.cd.markForCheck();
      return false;
    }
    return true;
  }

  public formatSubmitData(data: any): any {
    const res: any = {};

    res.name = data.name;
    res.symbol = data.symbol;
    res.title = data.title;
    res.description = data.description;
    res.space = data.space;
    res.access = Access.OPEN;
    res.pricePerToken = Number(data.price);
    res.totalSupply = Number(data.totalSupply * Math.pow(10, getDefDecimalIfNotSet(data.decimals)));
    res.allocations = data.allocations;
    res.links = data.links.map((l: { url: string }) => l.url);
    res.icon = data.icon;
    res.overviewGraphics = data.introductionary;
    res.termsAndConditions = data.termsAndConditionsLink;
    res.shortDescriptionTitle = data.shortTitle;
    res.shortDescription = data.shortDescription;
    res.decimals = data.decimals;
    return res;
  }

  public async submit(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }
    await this.auth.sign(this.formatSubmitData(this.newService.tokenForm.value), (sc, finish) => {
      this.notification
        .processRequest(this.tokenApi.create(sc), 'Created.', finish)
        .subscribe((val: any) => {
          this.router.navigate([ROUTER_UTILS.config.token.root, val?.uid]);
        });
    });
  }
}
