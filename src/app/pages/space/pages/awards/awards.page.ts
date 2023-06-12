import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Award } from '@build-5/interfaces';
import { AwardFilter } from '@build-5/lib';
import { BehaviorSubject, Subscription } from 'rxjs';
import { DataService } from './../../services/data.service';

@UntilDestroy()
@Component({
  selector: 'wen-awards',
  templateUrl: './awards.page.html',
  styleUrls: ['./awards.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwardsPage implements OnInit, OnDestroy {
  public spaceId?: string;
  public selectedListControl: FormControl = new FormControl(AwardFilter.ACTIVE);
  public hotTags: { value: AwardFilter; label: string }[] = [
    { value: AwardFilter.DRAFT, label: $localize`Pending` },
    { value: AwardFilter.ACTIVE, label: $localize`Active` },
    { value: AwardFilter.COMPLETED, label: $localize`Completed` },
    { value: AwardFilter.REJECTED, label: $localize`Rejected` },
  ];
  private subscriptions$: Subscription[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private seo: SeoService,
    public data: DataService,
    public deviceService: DeviceService,
  ) {}

  public ngOnInit(): void {
    this.route.parent?.params.subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.space.space.replace(':', '')];
      if (id) {
        this.cancelSubscriptions();
        this.spaceId = id;

        this.seo.setTags(
          $localize`Space - Awards`,
          $localize`Space's awards`,
          this.data.space$.value?.bannerUrl,
        );
      } else {
        this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
      }
    });

    this.selectedListControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val) => {
      if (this.spaceId && val === AwardFilter.COMPLETED) {
        this.data.listenToCompletedAwards(this.spaceId);
      } else if (this.spaceId && val === AwardFilter.REJECTED) {
        this.data.listenToRejectedAwards(this.spaceId);
      } else if (this.spaceId && val === AwardFilter.DRAFT) {
        this.data.listenToDraftAwards(this.spaceId);
      }
      this.cd.markForCheck();
    });
  }

  public getList(): BehaviorSubject<Award[] | undefined> {
    if (this.selectedListControl.value === this.filterOptions.ACTIVE) {
      return this.data.awardsActive$;
    } else if (this.selectedListControl.value === this.filterOptions.DRAFT) {
      return this.data.awardsDraft$;
    } else if (this.selectedListControl.value === this.filterOptions.REJECTED) {
      return this.data.awardsRejected$;
    } else {
      return this.data.awardsCompleted$;
    }
  }

  public getTitle(): string {
    if (this.selectedListControl.value === this.filterOptions.ACTIVE) {
      return 'Active';
    } else {
      return 'Completed';
    }
  }

  public handleFilterChange(filter: AwardFilter): void {
    this.selectedListControl.setValue(filter);
    this.cd.markForCheck();
  }

  public get filterOptions(): typeof AwardFilter {
    return AwardFilter;
  }

  public trackByUid(index: number, item: Award) {
    return item.uid;
  }

  public create(): void {
    this.router.navigate([
      '/' + ROUTER_UTILS.config.award.root,
      ROUTER_UTILS.config.award.newAward,
      { space: this.spaceId },
    ]);
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
