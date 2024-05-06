import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CollectionFilter } from '@api/collection.api';
import { DeviceService } from '@core/services/device';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/space/services/data.service';
import { Collection } from '@buildcore/interfaces';
import { BehaviorSubject, Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-collections',
  templateUrl: './collections.page.html',
  styleUrls: ['./collections.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionsPage implements OnInit, OnDestroy {
  public spaceId?: string;
  public selectedListControl: FormControl = new FormControl(CollectionFilter.AVAILABLE);
  public hotTags: { value: CollectionFilter; label: string }[] = [
    { value: CollectionFilter.PENDING, label: $localize`Pending` },
    { value: CollectionFilter.AVAILABLE, label: $localize`Available` },
    { value: CollectionFilter.REJECTED, label: $localize`Rejected` },
  ];
  private subscriptions$: Subscription[] = [];

  constructor(
    public data: DataService,
    public deviceService: DeviceService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private seo: SeoService,
  ) {}

  public ngOnInit(): void {
    this.selectedListControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val) => {
      if (this.spaceId && val === CollectionFilter.REJECTED) {
        this.data.listenToRejectedCollections(this.spaceId);
      } else if (this.spaceId && val === CollectionFilter.AVAILABLE) {
        this.data.listenToAvailableCollections(this.spaceId);
      } else if (this.spaceId && val === CollectionFilter.PENDING) {
        this.data.listenToPendingCollections(this.spaceId);
      }
      this.cd.markForCheck();
    });

    this.route.parent?.params.subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.space.space.replace(':', '')];
      if (id) {
        this.cancelSubscriptions();
        this.spaceId = id;
        this.selectedListControl.setValue(CollectionFilter.AVAILABLE);

        this.seo.setTags(
          $localize`Space - Collections`,
          $localize`Space's collections`,
          this.data.space$.value?.bannerUrl,
        );
      } else {
        this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
      }
    });
  }

  public handleFilterChange(filter: CollectionFilter): void {
    this.selectedListControl.setValue(filter);
    this.cd.markForCheck();
  }

  public get filterOptions(): typeof CollectionFilter {
    return CollectionFilter;
  }

  public create(): void {
    this.router.navigate([
      '/' + ROUTER_UTILS.config.collection.root,
      ROUTER_UTILS.config.collection.new,
      { space: this.spaceId },
    ]);
  }

  public getList(): BehaviorSubject<Collection[] | undefined> {
    if (this.selectedListControl.value === this.filterOptions.REJECTED) {
      return this.data.rejectedCollections$;
    } else if (this.selectedListControl.value === this.filterOptions.AVAILABLE) {
      return this.data.availableCollections$;
    } else {
      return this.data.pendingCollections$;
    }
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public trackByUid(index: number, item: Collection) {
    return item.uid;
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
