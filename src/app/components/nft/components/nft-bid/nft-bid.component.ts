import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Router } from '@angular/router';
import { FileApi } from '@api/file.api';
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { TransactionService } from '@core/services/transaction';
import { UnitsService } from '@core/services/units';
import { getBitItemItem, removeBitItemItem, setBitItemItem } from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/nft/services/data.service';
import { HelperService } from '@pages/nft/services/helper.service';
import {
  Collection,
  CollectionType,
  FILE_SIZES,
  Nft,
  Space,
  Timestamp,
  Transaction,
  TransactionType,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, interval, Subscription, take } from 'rxjs';

export enum StepType {
  CONFIRM = 'Confirm',
  TRANSACTION = 'Transaction',
  WAIT = 'Wait',
  COMPLETE = 'Complete',
  EXPIRED = 'Expired',
}

@UntilDestroy()
@Component({
  selector: 'wen-nft-bid',
  templateUrl: './nft-bid.component.html',
  styleUrls: ['./nft-bid.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftBidComponent implements OnInit {
  @Input() currentStep = StepType.CONFIRM;

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

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
    }
  }

  get nft(): Nft | null | undefined {
    return this._nft;
  }

  @Input()
  set collection(value: Collection | null | undefined) {
    this._collection = value;
    if (this.collection) {
      this.cache
        .getSpace(this.collection.royaltiesSpace)
        .pipe(untilDestroyed(this))
        .subscribe((space?: Space) => {
          this.royaltySpace = space;
          this.cd.markForCheck();
        });
    }
  }

  get collection(): Collection | null | undefined {
    return this._collection;
  }

  @Input() endsOnTicker$: BehaviorSubject<Timestamp | undefined> = new BehaviorSubject<
    Timestamp | undefined
  >(undefined);
  @Output() wenOnClose = new EventEmitter<void>();

  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public linkedTransactions$: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>(
    [],
  );
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  public stepType = StepType;
  public isCopied = false;
  public agreeTermsConditions = false;
  public mediaType: 'video' | 'image' | undefined;
  public targetAddress?: string;
  public targetAmount?: number;
  public path = ROUTER_UTILS.config.nft.root;
  public royaltySpace?: Space | null;

  private transSubscription?: Subscription;
  private _isOpen = false;
  private _nft?: Nft | null;
  private _collection?: Collection | null;

  constructor(
    public deviceService: DeviceService,
    public auth: AuthService,
    public data: DataService,
    public helper: HelperService,
    public previewImageService: PreviewImageService,
    public unitsService: UnitsService,
    public transactionService: TransactionService,
    private cd: ChangeDetectorRef,
    private fileApi: FileApi,
    private notification: NotificationService,
    private router: Router,
    private orderApi: OrderApi,
    private cache: CacheService,
  ) {}

  public ngOnInit(): void {
    const listeningToTransaction: string[] = [];
    this.transaction$.pipe(untilDestroyed(this)).subscribe((val) => {
      if (val && val.type === TransactionType.ORDER) {
        this.targetAddress = val.payload.targetAddress;
        this.targetAmount = this.nft?.auctionHighestBid || val.payload.amount;
        if (val.payload.expiresOn) {
          const expiresOn: dayjs.Dayjs = dayjs(val.payload.expiresOn.toDate());
          if (expiresOn.isBefore(dayjs()) || val.payload?.void || val.payload?.reconciled) {
            // It's expired.
            removeBitItemItem(
              val.payload.nft! + this.auth.member$.value?.uid + expiresOn.valueOf(),
            );
          }
          this.expiryTicker$.next(expiresOn);
        }
        if (val.linkedTransactions && val.linkedTransactions?.length > 0) {
          this.currentStep = StepType.WAIT;
          // Listen to other transactions.
          for (const tranId of val.linkedTransactions) {
            if (listeningToTransaction.indexOf(tranId) > -1) {
              continue;
            }

            listeningToTransaction.push(tranId);
            this.orderApi
              .listen(tranId)
              .pipe(untilDestroyed(this))
              .subscribe((t: Transaction | undefined) => {
                if (!t) {
                  return;
                }

                let currentArray = this.linkedTransactions$.value;
                const exists = currentArray.findIndex((o) => {
                  return o.uid === t.uid;
                });

                if (exists > -1) {
                  currentArray[exists] = t;
                } else {
                  currentArray.unshift(t);
                }

                // Re-order
                currentArray = currentArray.sort((c, b) => {
                  return b.createdOn!.toMillis() - c.createdOn!.toMillis();
                });

                this.linkedTransactions$.next(currentArray);
              });
          }
        } else if (!val.linkedTransactions || val.linkedTransactions.length === 0) {
          this.currentStep = StepType.TRANSACTION;
        }

        if (val && val.payload.void === true) {
          this.currentStep = StepType.EXPIRED;
        }

        if (val && val.payload.reconciled === true) {
          this.currentStep = StepType.COMPLETE;
        }
      }

      this.cd.markForCheck();
    });

    if (
      this.nft?.uid &&
      getBitItemItem(this.nft.uid + this.auth.member$.value?.uid + this.nft.auctionTo?.toMillis())
    ) {
      this.transSubscription = this.orderApi
        .listen(
          <string>(
            getBitItemItem(
              this.nft.uid + this.auth.member$.value?.uid + this.nft.auctionTo?.toMillis(),
            )
          ),
        )
        .subscribe(<any>this.transaction$);
    }

    // Run ticker.
    const int: Subscription = interval(1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.expiryTicker$.next(this.expiryTicker$.value);

        // If it's in the past.
        if (this.expiryTicker$.value) {
          const expiresOn: dayjs.Dayjs = dayjs(this.expiryTicker$.value);
          if (expiresOn.isBefore(dayjs())) {
            this.expiryTicker$.next(null);
            removeBitItemItem(this.nft!.uid + this.auth.member$.value?.uid + expiresOn.valueOf());
            int.unsubscribe();
            this.reset();
          }
        }
      });
  }

  public goToNft(): void {
    this.router.navigate(['/', this.path, this.nft?.uid]);
    this.reset();
    this.wenOnClose.next();
  }

  public getRecord(): Nft | null | undefined {
    return this.nft;
  }

  public reset(): void {
    this.isOpen = false;
    this.currentStep = StepType.CONFIRM;
    this.cd.markForCheck();
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public getTitle(): any {
    if (!this.nft) {
      return '';
    }

    if (this.nft.type === CollectionType.CLASSIC) {
      return this.nft.name;
    } else if (this.nft.type === CollectionType.GENERATED) {
      return $localize`Generated NFT`;
    } else if (this.nft.type === CollectionType.SFT) {
      return $localize`SFT`;
    }
  }

  public async proceedWithBid(): Promise<void> {
    if (!this.collection || !this.nft || !this.agreeTermsConditions) {
      return;
    }

    const params: any = {
      nft: this.nft.uid,
    };

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.orderApi.openBid(sc), 'Order created.', finish)
        .subscribe((val: any) => {
          this.transSubscription?.unsubscribe();
          setBitItemItem(
            params.nft + this.auth.member$.value?.uid + this.nft?.auctionTo?.toMillis(),
            val.uid,
          );
          this.transSubscription = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
        });
    });
  }

  public trackByUniqueId(index: number, item: any): number {
    return item.uniqueId;
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }
}
