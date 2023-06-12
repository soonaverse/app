import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FileApi } from '@api/file.api';
import { NftApi } from '@api/nft.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/nft/services/helper.service';
import { Collection, Nft, NftAccess, PRICE_UNITS, Timestamp, Units } from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { take } from 'rxjs';

export enum SaleType {
  NOT_FOR_SALE = 'NOT_FOR_SALE',
  FIXED_PRICE = 'FIXED_PRICE',
  AUCTION = 'AUCTION',
}

export interface UpdateEvent {
  nft?: string;
  type?: SaleType;
  access?: NftAccess | null;
  accessMembers?: string[] | null;
  availableFrom?: Timestamp | null;
  auctionFrom?: Timestamp | null;
  price?: number | null;
  auctionFloorPrice?: number | null;
  auctionLength?: number | null;
}

@UntilDestroy()
@Component({
  selector: 'wen-nft-sale',
  templateUrl: './nft-sale.component.html',
  styleUrls: ['./nft-sale.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftSaleComponent {
  @Input() isOpen = false;
  @Input() collection?: Collection | null;

  @Input()
  set nft(value: Nft | null | undefined) {
    this._nft = value;
    if (this._nft) {
      this.fileApi
        .getMetadata(this._nft.media)
        .pipe(take(1), untilDestroyed(this))
        .subscribe((o) => {
          this.mediaType = o;
          this.cd.markForCheck();
        });

      // Set default sale type.
      if (this._nft.auctionFrom) {
        this.currentSaleType = SaleType.AUCTION;
      } else if (this._nft.availableFrom) {
        this.currentSaleType = SaleType.FIXED_PRICE;
      } else {
        this.currentSaleType = SaleType.NOT_FOR_SALE;
      }

      this.cd.markForCheck();
    }
  }

  get nft(): Nft | null | undefined {
    return this._nft;
  }

  @Output() wenOnClose = new EventEmitter<void>();
  public saleType = SaleType;
  public currentSaleType = SaleType.NOT_FOR_SALE;
  public mediaType: 'video' | 'image' | undefined;
  private _nft?: Nft | null;

  constructor(
    public deviceService: DeviceService,
    public helper: HelperService,
    public unitsService: UnitsService,
    public previewImageService: PreviewImageService,
    private notification: NotificationService,
    private nftApi: NftApi,
    private cd: ChangeDetectorRef,
    private fileApi: FileApi,
    private auth: AuthService,
  ) {}

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public reset(): void {
    this.isOpen = false;
    this.cd.markForCheck();
  }

  public get priceUnits(): Units[] {
    return PRICE_UNITS;
  }

  public disabledStartDate(startValue: Date): boolean {
    if (startValue.getTime() < dayjs().toDate().getTime()) {
      return true;
    }

    return false;
  }

  public async update(e: UpdateEvent): Promise<void> {
    // If fixed we have to unset auction. Auction must not started yet.
    if (
      e.type === SaleType.FIXED_PRICE &&
      this.nft?.auctionFrom &&
      dayjs(this.nft.auctionFrom.toDate()).isBefore(dayjs())
    ) {
      e.auctionFloorPrice = null;
      e.auctionFrom = null;
      e.auctionLength = null;
    } else if (
      e.type === SaleType.FIXED_PRICE &&
      this.nft?.auctionFrom &&
      dayjs(this.nft.auctionFrom.toDate()).isAfter(dayjs())
    ) {
      // We can't change auction params anymore
      delete e.auctionFloorPrice;
      delete e.auctionFrom;
      delete e.auctionLength;
    }

    // If AUCTION remove/add dates.
    if (e.type === SaleType.AUCTION && this.nft?.availableFrom && !e.availableFrom) {
      e.availableFrom = null;
      e.price = null;
    }

    // TODO Or if it's coplete reset.
    if (
      e.type === SaleType.NOT_FOR_SALE &&
      this.nft?.auctionFrom &&
      dayjs(this.nft.auctionFrom.toDate()).isBefore(dayjs())
    ) {
      e = {
        type: SaleType.NOT_FOR_SALE,
      };
    }

    e.nft = this.nft?.uid;
    delete e.type;
    await this.auth.sign(e, (sc, finish) => {
      this.notification
        .processRequest(this.nftApi.setForSaleNft(sc), 'Submitted.', finish)
        .subscribe(() => {
          this.close();
        });
    });
  }
}
