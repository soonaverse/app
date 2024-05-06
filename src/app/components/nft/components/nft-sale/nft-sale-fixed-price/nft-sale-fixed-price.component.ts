import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { UnitsService } from '@core/services/units';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/nft/services/helper.service';
import {
  COL,
  DEFAULT_NETWORK,
  MAX_IOTA_AMOUNT,
  MIN_IOTA_AMOUNT,
  Member,
  NETWORK_DETAIL,
  Nft,
  NftAccess,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import { BehaviorSubject, Subscription, from } from 'rxjs';
import { SaleType, UpdateEvent } from '../nft-sale.component';

export enum TimeSaleOptionType {
  NOW = 'NOW',
  CUSTOM = 'CUSTOM',
}

@UntilDestroy()
@Component({
  selector: 'wen-nft-sale-fixed-price',
  templateUrl: './nft-sale-fixed-price.component.html',
  styleUrls: ['./nft-sale-fixed-price.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftSaleFixedPriceComponent implements OnInit, OnDestroy {
  @Input()
  set nft(value: Nft | null | undefined) {
    this._nft = value;
    if (this._nft) {
      this.availableFromControl.setValue(this._nft.availableFrom?.toDate() || '');
      this.selectedAccessControl.setValue(this._nft.saleAccess || NftAccess.OPEN);
      this.buyerControl.setValue(this._nft.saleAccessMembers || []);
      this.targetAccessOption$.next(this._nft.saleAccess || NftAccess.OPEN);
      if (this._nft.availablePrice) {
        this.priceControl.setValue(
          this._nft.availablePrice /
            NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
        );
      }
    }
  }

  get nft(): Nft | null | undefined {
    return this._nft;
  }

  @Output() public wenOnUpdate = new EventEmitter<UpdateEvent>();
  public form: FormGroup;
  public priceControl: FormControl = new FormControl('', [
    Validators.required,
    Validators.min(
      MIN_IOTA_AMOUNT / NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
    ),
    Validators.max(
      MAX_IOTA_AMOUNT / NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
    ),
  ]);
  public availableFromControl: FormControl = new FormControl('', Validators.required);
  public selectedAccessControl: FormControl = new FormControl(NftAccess.OPEN, Validators.required);
  public buyerControl: FormControl = new FormControl('');
  public minimumPrice = MIN_IOTA_AMOUNT;
  public maximumPrice = MAX_IOTA_AMOUNT;
  public filteredMembers$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  private _nft?: Nft | null;
  private memberSubscription?: Subscription;

  public availableTimeOption$ = new BehaviorSubject<TimeSaleOptionType>(TimeSaleOptionType.NOW);
  public targetAccessOption$ = new BehaviorSubject<NftAccess>(NftAccess.OPEN);

  constructor(
    public helper: HelperService,
    public unitsService: UnitsService,
    public readonly algoliaService: AlgoliaService,
  ) {
    this.form = new FormGroup({
      price: this.priceControl,
      availableFrom: this.availableFromControl,
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

    // Load initial members.
    this.subscribeMemberList('a');

    this.availableTimeOption$.pipe(untilDestroyed(this)).subscribe((availableTimeOption) => {
      if (availableTimeOption === TimeSaleOptionType.NOW) {
        const nowDate = new Date();
        this.availableFromControl.setValue(nowDate.toISOString());
      } else {
        this.availableFromControl.setValue('');
      }
    });

    this.targetAccessOption$.pipe(untilDestroyed(this)).subscribe((targetAccessOption) => {
      this.selectedAccessControl.setValue(targetAccessOption);
    });
  }

  private subscribeMemberList(search?: string): void {
    this.memberSubscription?.unsubscribe();
    this.memberSubscription = from(
      this.algoliaService.searchClient
        .initIndex(COL.MEMBER)
        .search(search || '', { length: 5, offset: 0 }),
    ).subscribe((r) => {
      this.filteredMembers$.next(
        r.hits.map((r) => {
          const member = r as unknown as Member;
          return {
            label: '@' + member.name || member.uid,
            value: member.uid,
          };
        }),
      );
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

  public searchMember(v: string): void {
    if (v) {
      this.subscribeMemberList(v);
    }
  }

  public submit(): void {
    const obj: any = {
      type: SaleType.FIXED_PRICE,
      availableFrom: this.availableFromControl.value,
      price:
        this.priceControl.value *
        NETWORK_DETAIL[this.nft?.mintingData?.network || DEFAULT_NETWORK].divideBy,
      access: this.selectedAccessControl.value,
    };

    if (this.selectedAccessControl.value !== NftAccess.OPEN) {
      obj.accessMembers = this.buyerControl.value;
    }

    this.wenOnUpdate.next(obj);
  }

  public ngOnDestroy(): void {
    this.memberSubscription?.unsubscribe();
  }

  public get availableTimeOptionTypes(): typeof TimeSaleOptionType {
    return TimeSaleOptionType;
  }
}
