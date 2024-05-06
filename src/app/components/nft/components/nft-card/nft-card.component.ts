import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { Router } from '@angular/router';
import { FileApi } from '@api/file.api';
import { MemberApi } from '@api/member.api';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/nft/services/helper.service';
import { CartService } from '@components/cart/services/cart.service';
import {
  Access,
  Collection,
  CollectionStatus,
  CollectionType,
  FILE_SIZES,
  Member,
  MIN_AMOUNT_TO_TRANSFER,
  Nft,
  NftAccess,
} from '@buildcore/interfaces';
import { BehaviorSubject, Subscription, take } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-nft-card',
  templateUrl: './nft-card.component.html',
  styleUrls: ['./nft-card.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftCardComponent implements OnInit, OnDestroy {
  private cartSubscription$!: Subscription;
  @Input() fullWidth?: boolean;
  @Input() enableWithdraw?: boolean;

  @Input()
  set nft(value: Nft | null | undefined) {
    if (this.memberApiSubscription$) {
      this.memberApiSubscription$.unsubscribe();
    }
    this._nft = value;
    const owner = this.nft?.owner || this.nft?.createdBy;
    if (owner) {
      this.memberApiSubscription$ = this.memberApi
        .listen(owner)
        .pipe(untilDestroyed(this))
        .subscribe(this.owner$);
    } else {
      this.owner$.next(undefined);
    }

    if (this.nft) {
      this.fileApi
        .getMetadata(this.nft.media)
        .pipe(take(1), untilDestroyed(this))
        .subscribe((o) => {
          this.mediaType = o;
          // this.cd.markForCheck();  // this seems to causing a serious issue within nfts.page !!!!!
          this.cd.detectChanges();
        });
    }
  }

  get nft(): Nft | null | undefined {
    return this._nft;
  }

  @Input() collection?: Collection | null;

  public mediaType: 'video' | 'image' | undefined;
  public isCheckoutOpen = false;
  public isBidOpen = false;
  public path = ROUTER_UTILS.config.nft.root;
  public owner$: BehaviorSubject<Member | undefined> = new BehaviorSubject<Member | undefined>(
    undefined,
  );
  private memberApiSubscription$?: Subscription;
  private _nft?: Nft | null;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public unitsService: UnitsService,
    public auth: AuthService,
    private cd: ChangeDetectorRef,
    private router: Router,
    private memberApi: MemberApi,
    private fileApi: FileApi,
    private cache: CacheService,
    public cartService: CartService,
  ) {}

  ngOnInit(): void {
    this.cartSubscription$ = this.cartService.getCartItems().subscribe(() => {
      this.cd.markForCheck();
    });
  }

  public onBuy(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.cache.openCheckout = true;
    this.router.navigate(['/', ROUTER_UTILS.config.nft.root, this.nft?.uid]);
  }

  public onImgErrorWeShowPlaceHolderVideo(event: any): any {
    // Try full image instead.
    event.target.src = '/assets/mocks/video_placeholder.jpg';
  }

  /**
   * As we are now using Algolia it does not have to be only timestamp.
   * @param date
   * @returns
   */
  public getDate(date: any): any {
    if (typeof date === 'object' && date?.toDate) {
      return date.toDate();
    } else {
      return date || undefined;
    }
  }

  private discount(): number {
    if (!this.collection?.space || !this.auth.member$.value || this._nft?.owner) {
      return 1;
    }

    const spaceRewards = (this.auth.member$.value.spaces || {})[this.collection.space];
    const descDiscounts = [...(this.collection.discounts || [])].sort(
      (a, b) => b.amount - a.amount,
    );
    for (const discount of descDiscounts) {
      const awardStat = (spaceRewards?.awardStat || {})[discount.tokenUid!];
      const memberTotalReward = awardStat?.totalReward || 0;
      if (memberTotalReward >= discount.tokenReward) {
        return 1 - discount.amount;
      }
    }
    return 1;
  }

  public applyDiscount(amount?: number | null): number {
    let finalPrice = Math.ceil((amount || 0) * this.discount());
    if (finalPrice < MIN_AMOUNT_TO_TRANSFER) {
      finalPrice = MIN_AMOUNT_TO_TRANSFER;
    }

    return finalPrice;
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public get targetAccess(): typeof Access {
    return Access;
  }

  public get targetNftAccess(): typeof NftAccess {
    return NftAccess;
  }

  public getBadgeProperties(): { label: string; className: string } {
    if (this.nft?.owner) {
      return {
        label: $localize`Available`,
        className: 'bg-tags-available dark:bg-tags-available-dark',
      };
    } else if (this.nft?.type === CollectionType.CLASSIC) {
      return {
        label: $localize`New NFT`,
        className: 'bg-tags-available dark:bg-tags-available-dark',
      };
    } else {
      const remaining = this.collection?.availableNfts || 0;
      return {
        label: remaining > 100 ? `100+ remaining` : `${remaining} remaining`,
        className:
          remaining >= 100
            ? 'bg-tags-commencing dark:bg-tags-commencing-dark'
            : 'bg-tags-closed dark:bg-tags-closed-dark',
      };
    }
  }

  public get collectionStatuses(): typeof CollectionStatus {
    return CollectionStatus;
  }

  public addToCart(
    event: MouseEvent,
    nft: Nft | null | undefined,
    collection: Collection | null | undefined,
  ): void {
    event.stopPropagation();
    event.preventDefault();

    if (nft && collection) {
      this.cartService.addToCart(nft, collection);
    } else {
      console.error('Attempted to add a null or undefined NFT or Collection to the cart');
    }
  }

  ngOnDestroy() {
    this.cartSubscription$.unsubscribe();
  }
}
