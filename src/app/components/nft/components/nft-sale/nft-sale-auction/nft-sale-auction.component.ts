import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { UnitsService } from '@core/services/units';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/nft/services/helper.service';
import {
  DEFAULT_NETWORK,
  MAX_IOTA_AMOUNT,
  MIN_IOTA_AMOUNT,
  NETWORK_DETAIL,
  Nft,
  NftAccess,
  TRANSACTION_DEFAULT_AUCTION,
} from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject } from 'rxjs';
import { SaleType, UpdateEvent } from '../nft-sale.component';

export enum availableTimeAuctionOptionType {
  NOW = 'NOW',
  CUSTOM = 'CUSTOM',
}

@UntilDestroy()
@Component({
  selector: 'wen-nft-sale-auction',
  templateUrl: './nft-sale-auction.component.html',
  styleUrls: ['./nft-sale-auction.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftSaleAuctionComponent implements OnInit {
  @Input()
  set nft(value: Nft | null | undefined) {
    this._nft = value;
    if (this._nft) {
      this.availableFromControl.setValue(this._nft.auctionFrom?.toDate() || '');
      this.selectedAccessControl.setValue(this._nft.saleAccess || NftAccess.OPEN);
      this.buyerControl.setValue(this._nft.saleAccessMembers || []);

      if (this._nft.auctionFloorPrice) {
        this.floorPriceControl.setValue(
          this._nft.auctionFloorPrice /
            NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
        );
      }

      if (this.nft?.auctionFrom && dayjs(this.nft.auctionFrom.toDate()).isAfter(dayjs())) {
        this.floorPriceControl.disable();
        this.availableFromControl.disable();
        this.selectedAccessControl.disable();
        this.buyerControl.disable();
      }
    }

    // Temp disabled:
    this.buyerControl.disable();
  }

  get nft(): Nft | null | undefined {
    return this._nft;
  }

  @Output() public wenOnUpdate = new EventEmitter<UpdateEvent>();
  public form: FormGroup;
  public floorPriceControl: FormControl = new FormControl('', [
    Validators.required,
    Validators.min(
      MIN_IOTA_AMOUNT / NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
    ),
    Validators.max(
      MAX_IOTA_AMOUNT / NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
    ),
  ]);
  public availableFromControl: FormControl = new FormControl('', Validators.required);
  public lengthFromControl: FormControl = new FormControl(3);
  public selectedAccessControl: FormControl = new FormControl(NftAccess.OPEN, Validators.required);
  public buyerControl: FormControl = new FormControl('');
  public minimumPrice = MIN_IOTA_AMOUNT;
  public maximumPrice = MAX_IOTA_AMOUNT;
  public isSubmitted = false;
  private _nft?: Nft | null;
  public availableTimeAuctionOption$ = new BehaviorSubject<availableTimeAuctionOptionType>(
    availableTimeAuctionOptionType.NOW,
  );

  constructor(
    public helper: HelperService,
    public unitsService: UnitsService,
    private cd: ChangeDetectorRef,
  ) {
    this.form = new FormGroup({
      floorPrice: this.floorPriceControl,
      availableFrom: this.availableFromControl,
      length: this.lengthFromControl,
      selectedAccess: this.selectedAccessControl,
      buyer: this.buyerControl,
    });
  }

  ngOnInit(): void {
    this.selectedAccessControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      switch (this.selectedAccessControl.value) {
        case NftAccess.OPEN:
          this.buyerControl.removeValidators(Validators.required);
          this.buyerControl.setErrors(null);
          break;
        case NftAccess.MEMBERS:
          this.buyerControl.addValidators(Validators.required);
          break;
      }
    });

    this.availableTimeAuctionOption$
      .pipe(untilDestroyed(this))
      .subscribe((availableTimeAuctionOption) => {
        if (availableTimeAuctionOption === availableTimeAuctionOptionType.NOW) {
          const nowDate = new Date();
          this.availableFromControl.setValue(nowDate.toISOString());
        } else {
          this.availableFromControl.setValue('');
        }
      });
  }

  public disabledStartDate(startValue: Date): boolean {
    if (dayjs(startValue).isBefore(dayjs(), 'days')) {
      return true;
    }

    return false;
  }

  public get targetAccess(): typeof NftAccess {
    return NftAccess;
  }

  public isProd(): boolean {
    return environment.production;
  }

  public submit(): void {
    let length = TRANSACTION_DEFAULT_AUCTION;
    if (this.lengthFromControl.value === 1) {
      length = 24 * 60 * 60 * 1000;
    } else if (this.lengthFromControl.value === 2) {
      length = 2 * 24 * 60 * 60 * 1000;
    }

    const up: UpdateEvent = {
      type: SaleType.FIXED_PRICE,
      auctionFrom: this.availableFromControl.value,
      auctionLength: length,
      auctionFloorPrice:
        this.floorPriceControl.value *
        NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
      access: this.selectedAccessControl.value,
    };

    if (this.selectedAccessControl.value !== NftAccess.OPEN) {
      up.accessMembers = this.buyerControl.value;
    }

    this.wenOnUpdate.next(up);
    this.cd.markForCheck();
  }

  public get availableTimeAuctionOptionTypes(): typeof availableTimeAuctionOptionType {
    return availableTimeAuctionOptionType;
  }
}
