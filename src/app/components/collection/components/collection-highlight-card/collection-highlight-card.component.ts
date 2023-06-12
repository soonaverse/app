import { ChangeDetectionStrategy, Component, Input, OnDestroy } from '@angular/core';
import { NftApi } from '@api/nft.api';
import { SpaceApi } from '@api/space.api';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Collection, Space, Timestamp } from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, Subscription } from 'rxjs';

export enum CollectionHighlightCardType {
  HIGHLIGHT = 'Highlight',
  RECENTLY = 'Recently',
}

@UntilDestroy()
@Component({
  selector: 'wen-collection-highlight-card',
  templateUrl: './collection-highlight-card.component.html',
  styleUrls: ['./collection-highlight-card.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionHighlightCardComponent implements OnDestroy {
  @Input() title = '';
  @Input() type = CollectionHighlightCardType.HIGHLIGHT;

  @Input()
  set collections(value: Collection[]) {
    this._collections = value;
    this.fetchData();
  }

  get collections(): Collection[] {
    return this._collections;
  }

  public spaces$: BehaviorSubject<Space | undefined>[] = [];
  private _collections: Collection[] = [];
  private subscriptions$: Subscription[] = [];

  constructor(
    public previewImageService: PreviewImageService,
    public unitsService: UnitsService,
    public deviceService: DeviceService,
    private spaceApi: SpaceApi,
    private nftApi: NftApi,
  ) {}

  public get collectionHighlightCardTypes(): typeof CollectionHighlightCardType {
    return CollectionHighlightCardType;
  }

  private fetchData(): void {
    this.cancelSubscriptions();
    this.spaces$ = [];
    this.collections.forEach((collection) => {
      const space$ = new BehaviorSubject<Space | undefined>(undefined);
      this.spaces$.push(space$);
      this.subscriptions$.push(
        this.spaceApi.listen(collection?.space).pipe(untilDestroyed(this)).subscribe(space$),
      );
    });
  }

  public lessThan1Day(date?: Timestamp): boolean {
    return dayjs(date?.toDate()).diff(dayjs(), 'day') <= 1;
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
