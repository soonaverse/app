import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import {
  FileMetedata,
  FILE_SIZES,
  Network,
  Transaction,
  TransactionType,
} from '@buildcore/interfaces';

export enum TimelineItemType {
  BADGE = 'Badge',
  LISTED_BY_MEMBER = 'ListedByMember',
  ORDER = 'Order',
  LISTED_BY_SPACE = 'ListedBySpace',
}

export interface BadgeTimelineItemPayload {
  image?: FileMetedata;
  date?: Date;
  name: string;
  xp: string;
  network?: Network;
}

export interface ListedByMemberTimelineItemPayload {
  image?: string;
  date?: Date;
  name: string;
  isAuction: boolean;
  network?: Network;
}

export interface OrderTimelineItemPayload {
  image?: FileMetedata;
  date?: Date;
  name: string;
  amount: number;
  transactions: Transaction[];
  network?: Network;
}

export interface ListedBySpaceTimelineItemPayload {
  image?: string;
  date?: Date;
  name: string;
  network?: Network;
}

export type TimelineItemPayload =
  | BadgeTimelineItemPayload
  | ListedByMemberTimelineItemPayload
  | OrderTimelineItemPayload
  | ListedBySpaceTimelineItemPayload;

export interface TimelineItem {
  type: TimelineItemType;
  payload: TimelineItemPayload;
}

@Component({
  selector: 'wen-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimelineComponent {
  @Input()
  set items(value: TimelineItem[]) {
    this._items = value;
  }

  get items(): TimelineItem[] {
    return this._items;
  }

  @Input() isCollapsable = false;
  public showAll = false;
  public collapsedItemsCount = 2;
  public activeItems: (string | undefined)[] = [];

  private _items: TimelineItem[] = [];

  constructor(
    public deviceService: DeviceService,
    public transactionService: TransactionService,
    public previewImageService: PreviewImageService,
    public cache: CacheService,
    public unitsService: UnitsService,
    private cd: ChangeDetectorRef,
  ) {}

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public get transactionTypes(): typeof TransactionType {
    return TransactionType;
  }

  public trackByUid(index: number, item: any) {
    return item.uid;
  }

  public get timelineItemTypes(): typeof TimelineItemType {
    return TimelineItemType;
  }

  public getOrdersLength(): number {
    return this.items.filter((item) => item.type === TimelineItemType.ORDER).length;
  }

  public castAsBadgePayload(payload: TimelineItemPayload): BadgeTimelineItemPayload {
    return payload as BadgeTimelineItemPayload;
  }

  public castAsListedByMemberPayload(
    payload: TimelineItemPayload,
  ): ListedByMemberTimelineItemPayload {
    return payload as ListedByMemberTimelineItemPayload;
  }

  public castAsOrderPayload(payload: TimelineItemPayload): OrderTimelineItemPayload {
    return payload as OrderTimelineItemPayload;
  }

  public castAsListedBySpacePayload(
    payload: TimelineItemPayload,
  ): ListedBySpaceTimelineItemPayload {
    return payload as ListedBySpaceTimelineItemPayload;
  }

  public activeChange(event: boolean, item: TimelineItem): void {
    if (event) {
      this.activeItems = [...this.activeItems, item?.payload?.date?.toISOString()];
    } else {
      this.activeItems = this.activeItems.filter(
        (activeItem) => activeItem !== item?.payload?.date?.toISOString(),
      );
    }
    this.cd.markForCheck();
  }

  public isActive(item: TimelineItem): boolean {
    return this.activeItems.includes(item?.payload?.date?.toISOString());
  }
}
