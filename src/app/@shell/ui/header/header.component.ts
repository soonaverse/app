import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import { NavigationStart, Router } from '@angular/router';
import { CollectionApi } from '@api/collection.api';
import { NftApi } from '@api/nft.api';
import { NotificationApi } from '@api/notification.api';
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { FormatTokenPipe } from '@core/pipes/formatToken/format-token.pipe';
import { CheckoutService } from '@core/services/checkout';
import { DeviceService } from '@core/services/device';
import { RouterService } from '@core/services/router';
import {
  StorageItem,
  getItem,
  getNotificationItem,
  removeItem,
  setNotificationItem,
} from '@core/utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Collection,
  FILE_SIZES,
  Member,
  Nft,
  Notification,
  NotificationType,
  TRANSACTION_AUTO_EXPIRY_MS,
  Transaction,
  TransactionPayloadType
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import { NzNotificationRef, NzNotificationService } from 'ng-zorro-antd/notification';
import {
  BehaviorSubject,
  Subscription,
  debounceTime,
  firstValueFrom,
  fromEvent,
  interval,
  skip,
} from 'rxjs';
import { MemberApi } from './../../../@api/member.api';
import { CartService } from './../../../components/cart/services/cart.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CheckoutOverlayComponent } from '@components/cart/components/checkout/checkout-overlay.component';


const IS_SCROLLED_HEIGHT = 20;

export interface NotificationContent {
  title: string;
  content: string;
}

@UntilDestroy()
@Component({
  selector: 'wen-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit, OnDestroy {
  @ViewChild('notCompletedNotification', { static: false })
  notCompletedNotification!: TemplateRef<any>;
  @ViewChild('emptyIcon', { static: false }) emptyIcon!: TemplateRef<any>;

  public path = ROUTER_UTILS.config.base;
  public enableCreateAwardProposal = false;
  public accessSubscriptions$: Subscription[] = [];
  public isMemberProfile = false;
  public isLandingPage = false;
  public isMobileMenuVisible = false;
  public isScrolled = false;
  public isCheckoutOpen = false;
  public isCartCheckoutOpen = false;
  public currentCheckoutNft?: Nft;
  public currentCheckoutCollection?: Collection;
  public notifications$: BehaviorSubject<Notification[]> = new BehaviorSubject<Notification[]>([]);
  private notificationRef?: NzNotificationRef;
  public expiryTicker$: BehaviorSubject<dayjs.Dayjs | null> =
    new BehaviorSubject<dayjs.Dayjs | null>(null);
  private transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  private subscriptionTransaction$?: Subscription;
  private subscriptionNotification$?: Subscription;
  public cartItemCount = 0;
  private cartItemsSubscription!: Subscription;

  @Output() openCartModal = new EventEmitter<void>();

  constructor(
    public auth: AuthService,
    public deviceService: DeviceService,
    public routerService: RouterService,
    public formatToken: FormatTokenPipe,
    private router: Router,
    private memberApi: MemberApi,
    private orderApi: OrderApi,
    private nftApi: NftApi,
    private notificationApi: NotificationApi,
    private collectionApi: CollectionApi,
    private cd: ChangeDetectorRef,
    private nzNotification: NzNotificationService,
    private checkoutService: CheckoutService,
    public cartService: CartService,
    private modalService: NzModalService,
  ) {}

  public ngOnInit(): void {
    this.member$.pipe(untilDestroyed(this)).subscribe((obj) => {
      if (obj?.uid) {
        this.cancelAccessSubscriptions();
        this.accessSubscriptions$.push(
          this.memberApi
            .topSpaces(obj.uid, undefined, undefined, undefined, 1)
            .subscribe((space) => {
              this.enableCreateAwardProposal = space.length > 0;
              this.cd.markForCheck();
            }),
        );
      } else {
        this.enableCreateAwardProposal = false;
        this.cd.markForCheck();
      }
    });

    this.cartItemsSubscription = this.cartService.getCartItems().subscribe(items => {
      this.cartItemCount = items.length;
    });

    const memberRoute = `/${ROUTER_UTILS.config.member.root}/`;
    const landingPageRoute = `/${ROUTER_UTILS.config.base.home}`;

    this.router.events.pipe(untilDestroyed(this)).subscribe((obj) => {
      if (obj instanceof NavigationStart) {
        const previousIsMemberProfile = this.isMemberProfile;
        const previousIsLandingPage = this.isLandingPage;

        this.isMemberProfile = Boolean(obj.url.startsWith(memberRoute));
        this.isLandingPage = Boolean(obj.url === landingPageRoute);

        if (
          previousIsMemberProfile !== this.isMemberProfile ||
          previousIsLandingPage ||
          this.isLandingPage
        ) {
          this.cd.markForCheck();
        }
      }
    });

    // Monitor scroll.
    fromEvent(window, 'scroll')
      .pipe(debounceTime(50), untilDestroyed(this))
      .subscribe(this.onScroll.bind(this));

    this.transaction$.pipe(skip(1), untilDestroyed(this)).subscribe((o) => {
      let expired = false;
      if (o) {
        const expiresOn: dayjs.Dayjs = dayjs(o.createdOn!.toDate()).add(
          TRANSACTION_AUTO_EXPIRY_MS,
          'ms',
        );
        this.expiryTicker$.next(expiresOn);
        if (expiresOn.isBefore(dayjs()) || o.payload?.void || o.payload?.reconciled) {
          expired = true;
        }
      }

      if (expired === false && o?.payload.void === false && o.payload.reconciled === false) {
        if (!this.notificationRef) {
          this.notificationRef = this.nzNotification.template(this.notCompletedNotification, {
            nzDuration: 0,
            nzCloseIcon: this.emptyIcon,
          });
        }
      } else {
        this.removeCheckoutNotification();
      }
    });

    // Check periodically if there is something in the checkout.
    interval(500)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        if (this.checkoutService.modalOpen$.value) {
          this.removeCheckoutNotification(false);
        } else {
          if (
            getItem(StorageItem.CheckoutTransaction) &&
            (!this.subscriptionTransaction$ || this.subscriptionTransaction$.closed)
          ) {
            this.subscriptionTransaction$ = this.orderApi
              .listen(<any>getItem(StorageItem.CheckoutTransaction))
              .pipe(untilDestroyed(this))
              .subscribe(<any>this.transaction$);
          }
        }
      });

    const int: Subscription = interval(1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.expiryTicker$.next(this.expiryTicker$.value);

        // If it's in the past.
        if (this.expiryTicker$.value && this.expiryTicker$.value.isBefore(dayjs())) {
          this.expiryTicker$.next(null);
          int.unsubscribe();
          this.removeCheckoutNotification();
        }
      });

    let lastMember: string | undefined;
    this.auth.member$.pipe(untilDestroyed(this)).subscribe((m) => {
      if (m && lastMember !== m.uid) {
        this.subscriptionNotification$?.unsubscribe();
        this.subscriptionNotification$ = this.notificationApi
          .topMember(m.uid, undefined, 25)
          .subscribe(this.notifications$);
        lastMember = m.uid;
      } else if (!m) {
        this.notifications$.next([]);
        lastMember = undefined;
      }
    });

    this.cartService.showCart$.subscribe(value => {
      // console.log('Current value of showCart$: ', value);
    });
  }

  public async onOpenCheckout(): Promise<void> {
    const t = this.transaction$.getValue();
    console.log('[header-onOpenCheckout] transaction: ', t)
    console.log('[header-onOpenCheckout] t?.payload.type: ', t?.payload.type)
    if (t?.payload.type == TransactionPayloadType.NFT_PURCHASE_BULK) {
      console.log('[header-onOpenCheckout] !t?.payload.type && t?.payload.type == TransactionPayloadType.NFT_PURCHASE_BULK equals true and isCartCheckoutOpen set to true')
      this.openCartModal.emit();
      this.openCheckoutOverlay();
    }

    if (!t?.payload.nft || !t.payload.collection) {
      return;
    }
    const collection: Collection | undefined = await firstValueFrom(
      this.collectionApi.listen(t?.payload.collection),
    );
    let nft: Nft | undefined = undefined;
    try {
      nft = await firstValueFrom(this.nftApi.listen(t?.payload?.nft));
    } catch (_e) {
      // If it's not classic or re-sale we're using placeholder NFT
      if (collection?.placeholderNft) {
        nft = await firstValueFrom(this.nftApi.listen(collection?.placeholderNft));
      }
    }
    if (nft && collection) {
      this.currentCheckoutCollection = collection;
      this.currentCheckoutNft = nft;
      this.isCheckoutOpen = true;
      this.cd.markForCheck();
    }
  }

  private openCheckoutOverlay(): void {
    const cartItems = this.cartService.getCartItems().getValue();

    this.modalService.create({
      nzTitle: 'Checkout',
      nzContent: CheckoutOverlayComponent,
      nzComponentParams: { items: cartItems },
      nzFooter: null,
      nzWidth: '80%',
    });
  }

  public handleOpenCartModal(): void {
    this.openCartModal.emit();
  }


  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public get isLoggedIn$(): BehaviorSubject<boolean> {
    return this.auth.isLoggedIn$;
  }

  public get member$(): BehaviorSubject<Member | undefined> {
    return this.auth.member$;
  }

  public get urlToDiscover(): string {
    return '/' + ROUTER_UTILS.config.market.root;
  }

  public closeCheckout(): void {
    this.checkoutService.modalOpen$.next(false);
    this.isCheckoutOpen = false;
  }

  public closeCartCheckout() {
    this.isCartCheckoutOpen = false;
  }

  public goToMyProfile(): void {
    if (this.member$.value?.uid) {
      this.router.navigate([
        ROUTER_UTILS.config.member.root,
        this.member$.value.uid,
        ROUTER_UTILS.config.member.activity,
      ]);
    }
  }

  private onScroll(): void {
    this.isScrolled = window?.scrollY > IS_SCROLLED_HEIGHT;
    this.cd.markForCheck();
  }

  public trackByUid(index: number, item: Notification) {
    return item.uid;
  }

  private removeCheckoutNotification(removeFromStorage = true): void {
    if (this.notificationRef) {
      this.nzNotification.remove(this.notificationRef.messageId);
      this.notificationRef = undefined;
    }

    this.subscriptionTransaction$?.unsubscribe();
    if (removeFromStorage) {
      this.currentCheckoutNft = undefined;
      this.currentCheckoutCollection = undefined;
      removeItem(StorageItem.CheckoutTransaction);
    }
  }

  public notificationVisibleChange(): void {
    if (!this.auth.member$.value?.uid) {
      return;
    }

    setTimeout(() => {
      if (this.auth.member$.value) {
        setNotificationItem(
          this.auth.member$.value.uid,
          this.notifications$.value[this.notifications$.value.length - 1]?.uid,
        );
      }
      this.cd.markForCheck();
    }, 2500);
  }

  public getCartItemCount(): number {
    return this.cartItemCount;
  }

  public unreadNotificationCount(): number {
    if (!this.notifications$.value.length || !this.auth.member$.value?.uid) {
      return 0;
    }

    if (!getNotificationItem(this.auth.member$.value?.uid)) {
      return this.notifications$.value.length;
    }

    return (
      this.notifications$.value.indexOf(
        <Notification>getNotificationItem(this.auth.member$.value?.uid),
      ) + 1
    );
  }

  public getNotificationDetails(not: Notification): NotificationContent {
    if (not.type === NotificationType.WIN_BID) {
      const title = $localize`You won the NFT`;
      const contentYour = $localize`You are a proud owner of a new NFT. Congratulations!`;

      return {
        title: title + ' ' + not.params.nft.name,
        content: contentYour,
      };
    } else if (not.type === NotificationType.LOST_BID) {
      const title = $localize`You lost your bid!`;
      const contentYour = $localize`Your bid on `;
      const contentReceived = $localize` was outbid. Try again!`;

      return {
        title: title,
        content: contentYour + ' ' + not.params.nft.name + ' ' + contentReceived,
      };
    } else if (not.type === NotificationType.NEW_BID) {
      const titleOffered = $localize`just made an offer.`;
      const contentYour = $localize`Your`;
      const contentReceived = $localize`has received a new bid.`;

      return {
        title: '@' + not.params.member.name + ' ' + titleOffered,
        content: contentYour + ' ' + not.params.nft.name + ' ' + contentReceived,
      };
    } else {
      return {
        title: $localize`Unsupported`,
        content: $localize`This notification is not yet supported in your language`,
      };
    }
  }

  public cancelAccessSubscriptions(): void {
    this.accessSubscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public openShoppingCart(): void {
    // console.log('Opening shopping cart...');
    this.cartService.showCart();
  }

  public handleCartCheckout(): void {
    this.isCartCheckoutOpen = true;
    this.cd.markForCheck();
  }


  public ngOnDestroy(): void {
    this.cancelAccessSubscriptions();
    this.subscriptionNotification$?.unsubscribe();
    this.subscriptionTransaction$?.unsubscribe();
    this.currentCheckoutNft = undefined;
    this.currentCheckoutCollection = undefined;
    if (this.cartItemsSubscription) {
      this.cartItemsSubscription.unsubscribe();
    }
  }
}
