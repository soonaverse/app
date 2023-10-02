import { Injectable, NgZone } from '@angular/core';
import { GlobeIconComponent } from '@components/icon/globe/globe.component';
import { NftIconComponent } from '@components/icon/nft/nft.component';
import { PoolIconComponent } from '@components/icon/pool/pool.component';
import { RocketIconComponent } from '@components/icon/rocket/rocket.component';
import { StakingIconComponent } from '@components/icon/staking/staking.component';
import { SwapIconComponent } from '@components/icon/swap/swap.component';
import { TokenIconComponent } from '@components/icon/token/token.component';
import { UnamusedIconComponent } from '@components/icon/unamused/unamused.component';
import { getItem, setItem, StorageItem } from '@core/utils';
import { undefinedToEmpty } from '@core/utils/manipulations.utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import detectEthereumProvider from '@metamask/detect-provider';
import {
  EthAddress,
  Member,
  Network,
  StakeType,
  tiers,
  TOKEN_EXPIRY_HOURS,
  WenRequest,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, firstValueFrom, skip, Subscription } from 'rxjs';
import { MemberApi, TokenDistributionWithAirdrops } from './../../../@api/member.api';
import { removeItem } from './../../../@core/utils/local-storage.utils';
const tanglePay = (window as any).iota;

export interface MetamaskSignature {
  address: string;
  req: WenRequest;
}

export interface SignCallback {
  (sc: any, finish: any): void;
}

export interface MenuItem {
  route: string[];
  icon: any;
  title: string;
  authSepeator: boolean;
  highlight?: string;
  unAuthauthSepeator: boolean;
}

export enum WalletStatus {
  HIDDEN = 0,
  OPEN = 1,
  ACTIVE = 2,
  WRONG_CHAIN = 3,
}

export enum Wallets {
  TanglePay = 'TanglePay',
  Metamask = 'MetaMask',
  // firefly = 'Firefly',
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  public isLoggedIn$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    this.isCustomTokenNotExpired(getItem(StorageItem.CustomToken)) ? true : false,
  );
  public showWalletPopup$: BehaviorSubject<WalletStatus> = new BehaviorSubject<WalletStatus>(
    WalletStatus.HIDDEN,
  );
  public member$: BehaviorSubject<Member | undefined> = new BehaviorSubject<Member | undefined>(
    undefined,
  );
  public memberSoonDistribution$: BehaviorSubject<TokenDistributionWithAirdrops | undefined> =
    new BehaviorSubject<TokenDistributionWithAirdrops | undefined>(undefined);
  public memberLevel$: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public desktopMenuItems$: BehaviorSubject<MenuItem[]> = new BehaviorSubject<MenuItem[]>([]);
  public mobileMenuItems$: BehaviorSubject<MenuItem[]> = new BehaviorSubject<MenuItem[]>([]);
  private memberSubscription$?: Subscription;
  private memberStakingSubscription$?: Subscription;
  private discoverMenuItem: MenuItem = {
    route: [ROUTER_UTILS.config.discover.root],
    icon: RocketIconComponent,
    title: $localize`Discover`,
    authSepeator: true,
    unAuthauthSepeator: false,
  };
  private stakingMenuItem: MenuItem = {
    route: [ROUTER_UTILS.config.soonStaking.root],
    icon: StakingIconComponent,
    title: $localize`Staking`,
    authSepeator: false,
    unAuthauthSepeator: false,
  };
  private tokenMenuItem: MenuItem = {
    route: [ROUTER_UTILS.config.tokens.root],
    icon: TokenIconComponent,
    title: $localize`Tokens`,
    authSepeator: true,
    unAuthauthSepeator: true,
  };
  private swapMenuItem: MenuItem = {
    route: [ROUTER_UTILS.config.swap.root],
    icon: SwapIconComponent,
    title: $localize`Swap`,
    authSepeator: false,
    unAuthauthSepeator: false,
  };
  private poolMenuItem: MenuItem = {
    route: [ROUTER_UTILS.config.farming.farming],
    icon: PoolIconComponent,
    title: $localize`Farming`,
    highlight: 'Earn $SOON',
    authSepeator: false,
    unAuthauthSepeator: false,
  };
  private marketMenuItem: MenuItem = {
    route: [ROUTER_UTILS.config.market.root],
    icon: NftIconComponent,
    title: $localize`Marketplace`,
    authSepeator: true,
    unAuthauthSepeator: true,
  };
  private overviewMenuItem: MenuItem = {
    route: [ROUTER_UTILS.config.base.dashboard],
    icon: GlobeIconComponent,
    title: $localize`My Overview`,
    authSepeator: false,
    unAuthauthSepeator: false,
  };

  constructor(
    private memberApi: MemberApi,
    private ngZone: NgZone,
    private notification: NzNotificationService,
  ) {
    // Make sure member exists when we are logged in.
    this.member$.pipe(skip(1)).subscribe((m) => {
      if (!m && this.isLoggedIn$.value) {
        this.signOut();
      }
    });

    this.memberSoonDistribution$.subscribe((v) => {
      if (v && (v?.stakes?.[StakeType.DYNAMIC]?.value || 0) > 0) {
        let l = -1;
        tiers.forEach((a) => {
          if ((v?.stakes?.[StakeType.DYNAMIC]?.value || 0) >= a) {
            l++;
          }
        });

        this.memberLevel$.next(l);
      } else {
        this.memberLevel$.next(0);
      }
    });

    if (this.isLoggedIn$.value) {
      const customToken: any = getItem(StorageItem.CustomToken);
      if (!this.isCustomTokenNotExpired(customToken)) {
        if (customToken) {
          removeItem(StorageItem.CustomToken);
        }
        this.isLoggedIn$.next(false);
      } else {
        this.listenToAccountChange();
        this.monitorMember(customToken.address);
      }
    }

    // Add delay on initial load.
    setTimeout(() => {
      this.member$.subscribe((val) => {
        if (val) {
          this.setAuthMenu(val.uid);
        } else {
          this.setUnAuthMenu();
        }
      });

      this.isLoggedIn$.subscribe((val) => {
        if (!val) {
          this.setUnAuthMenu();
        }
      });
    }, 750);
  }

  public openWallet(): void {
    this.showWalletPopup$.next(WalletStatus.OPEN);
  }

  public hideWallet(): void {
    this.showWalletPopup$.next(WalletStatus.HIDDEN);
  }

  get isLoggedIn(): boolean {
    return this.isLoggedIn$.getValue();
  }

  public isCustomTokenNotExpired(customToken?: any): boolean {
    return customToken && customToken.expiresOn && dayjs(customToken.expiresOn).isAfter(dayjs());
  }

  public async sign(params: any = {}, cb: SignCallback): Promise<WenRequest | undefined> {
    this.showWalletPopup$.next(WalletStatus.ACTIVE);
    // We support either resign with metamask or reuse token.
    let sc: WenRequest | undefined | false = undefined;
    const customToken: any = getItem(StorageItem.CustomToken);
    const wallet = customToken.wallet || Wallets.Metamask;
    // check it's not expired.
    if (this.isCustomTokenNotExpired(customToken)) {
      sc = {
        address: customToken.address,
        customToken: customToken.value,
        body: params,
      };
    } else if (customToken) {
      // For now we keep going, but they'll have to re-sign.
      // removeItem(StorageItem.CustomToken);
    }

    if (!sc) {
      if (wallet === Wallets.Metamask) {
        sc = await this.signWithMetamask(undefinedToEmpty(params));
      } else if (wallet === Wallets.TanglePay) {
        sc = await this.signWithTanglePay(undefinedToEmpty(params));
      }
    }

    if (!sc) {
      this.notification.error(
        $localize`Unable to sign transaction. Please try to reload page.`,
        '',
      );
      this.showWalletPopup$.next(WalletStatus.HIDDEN);
      return undefined;
    }

    // Callback function.
    cb(sc, () => {
      this.showWalletPopup$.next(WalletStatus.HIDDEN);
    });
    return sc;
  }

  public onMetaMaskAccountChange(accounts: string[]): void {
    if (accounts[0] !== this.member$.value?.uid) {
      this.signOut();
    }
  }

  public async stopMetamaskListeners(): Promise<void> {
    const provider: any = await detectEthereumProvider();
    if (provider) {
      provider.removeListener('accountsChanged', this.onMetaMaskAccountChange.bind(this));
    }
  }

  public async listenToAccountChange(): Promise<void> {
    const provider: any = await detectEthereumProvider();
    if (provider) {
      this.stopMetamaskListeners();
      provider.on('accountsChanged', this.onMetaMaskAccountChange.bind(this));
    }
  }

  public async mint(): Promise<boolean> {
    // TODO waiting for stable EVM to plug it into our SC.
    return true;
  }

  private async signWithMetamask(params: any = {}): Promise<WenRequest | undefined | false> {
    const provider: any = await detectEthereumProvider();
    if (provider) {
      try {
        try {
          if (!(await provider._metamask.isUnlocked())) {
            this.notification.error($localize`You must unlock your MetaMask first!`, '');
            this.showWalletPopup$.next(WalletStatus.HIDDEN);
            return undefined;
          }

          // Make sure account is always selected.
          await provider.request({
            method: 'eth_requestAccounts',
            params: [{ eth_accounts: {} }],
          });
        } catch (e) {
          this.notification.error(
            $localize`You must enable access to read your account address.`,
            '',
          );
          this.showWalletPopup$.next(WalletStatus.HIDDEN);
          return undefined;
        }

        if (!provider.selectedAddress) {
          this.notification.error($localize`Please make sure you select address in MetaMask!`, '');
          this.showWalletPopup$.next(WalletStatus.HIDDEN);
          return undefined;
        }

        const member: Member | undefined = await firstValueFrom(
          this.memberApi.createIfNotExists(provider.selectedAddress),
        );
        if (!member) {
          this.notification.error($localize`Unable to get nonce to authenticate!`, '');
          this.showWalletPopup$.next(WalletStatus.HIDDEN);
          return undefined;
        }

        const signature: string = await provider.request({
          method: 'personal_sign',
          params: [`0x${this.toHex(member.nonce!)}`, provider.selectedAddress],
        });

        return {
          address: provider.selectedAddress,
          signature: signature,
          body: params,
        };
      } catch (e) {
        this.showWalletPopup$.next(WalletStatus.HIDDEN);
        return undefined;
      }
    } else {
      this.showWalletPopup$.next(WalletStatus.HIDDEN);
      return false;
    }
  }

  private async signWithTanglePay(params: any = {}): Promise<WenRequest | undefined | false> {
    let currentAddress: string | undefined = undefined;
    if (tanglePay.isTanglePay) {
      try {
        try {
          // Make sure account is always selected.
          const response: { address: string; node: string } = await tanglePay.request({
            method: 'iota_connect',
          });
          currentAddress = response.address.toLowerCase();
        } catch (e) {
          this.notification.error($localize`Unable to connect your TanglePay wallet.`, '');
          this.showWalletPopup$.next(WalletStatus.HIDDEN);
          return undefined;
        }

        if (!currentAddress) {
          this.notification.error($localize`Unable to detect address in TanglePay!`, '');
          this.showWalletPopup$.next(WalletStatus.HIDDEN);
          return undefined;
        }

        // This is not ETH address.
        let publicKey = undefined;
        let network: Network | undefined = undefined;
        if (!currentAddress.startsWith('0x')) {
          publicKey = await tanglePay.request({
            method: 'iota_getPublicKey',
            params: {},
          });

          if (currentAddress.startsWith(Network.RMS)) {
            network = Network.RMS;
          } else if (currentAddress.startsWith(Network.SMR)) {
            network = Network.SMR;
          } else if (currentAddress.startsWith(Network.IOTA)) {
            network = Network.IOTA;
          } else if (currentAddress.startsWith(Network.ATOI)) {
            network = Network.ATOI;
          }
        }

        const member: Member | undefined = await firstValueFrom(
          this.memberApi.createIfNotExists(currentAddress),
        );
        if (!member) {
          this.notification.error($localize`Unable to get nonce to authenticate!`, '');
          this.showWalletPopup$.next(WalletStatus.HIDDEN);
          return undefined;
        }

        const signature: string = await tanglePay.request({
          method: 'personal_sign',
          params: {
            content: `0x${this.toHex(member.nonce!)}`,
          },
        });

        const returnObj: WenRequest = {
          address: currentAddress,
          signature: signature,
          body: params,
        };

        // Add public key if it's provided for non ETH address.
        if (publicKey && network) {
          returnObj.publicKey = {
            hex: publicKey,
            network: network,
          };
        }

        return returnObj;
      } catch (e) {
        this.showWalletPopup$.next(WalletStatus.HIDDEN);
        return undefined;
      }
    } else {
      this.showWalletPopup$.next(WalletStatus.HIDDEN);
      return false;
    }
  }

  public monitorMember(address: EthAddress): void {
    this.memberSubscription$ = this.memberApi.listen(address).subscribe((v) => {
      this.member$.next(v);
    });
    this.memberStakingSubscription$ = this.memberApi
      .soonDistributionStats(address)
      .subscribe((v) => {
        this.memberSoonDistribution$.next(v);
      });
  }

  public toHex(stringToConvert: string) {
    return stringToConvert
      .split('')
      .map((c) => {
        return c.charCodeAt(0).toString(16).padStart(2, '0');
      })
      .join('');
  }

  public async signIn(wallet: Wallets = Wallets.Metamask): Promise<boolean> {
    this.showWalletPopup$.next(WalletStatus.ACTIVE);
    let sc: WenRequest | undefined | false;
    if (wallet === Wallets.Metamask) {
      sc = await this.signWithMetamask({});
    } else if (wallet === Wallets.TanglePay) {
      sc = await this.signWithTanglePay({});
    }

    if (!sc) {
      // Missing wallet.
      if (sc === false) {
        this.notification.success($localize`You have to open Soonaverse in wallet app.`, '');
      } else {
        this.notification.error($localize`Failed to initialize wallet, try to reload page.`, '');
      }
      return false;
    }

    // Refresh custom token.
    let failed = false;
    let authToken;
    try {
      authToken = await firstValueFrom(this.memberApi.generateAuthToken(sc));
    } catch (e) {
      failed = true;
    }

    if (authToken && failed === false) {
      setItem(StorageItem.CustomToken, {
        value: authToken,
        wallet: wallet,
        address: sc.address,
        expiresOn: dayjs().add(TOKEN_EXPIRY_HOURS, 'hour').valueOf(),
      });

      this.showWalletPopup$.next(WalletStatus.HIDDEN);
      // Let's autheticate right the way with just UID.
      this.member$.next({
        uid: sc.address,
      });
      this.isLoggedIn$.next(true);

      // Let's make sure we monitor the member.
      this.monitorMember(sc.address);

      // Listen to Metamask changes.
      this.listenToAccountChange();

      return true;
    } else {
      this.notification.error($localize`Unable to connect your TanglePay wallet.`, '');
      this.showWalletPopup$.next(WalletStatus.HIDDEN);
      return false;
    }
  }

  signOut(): void {
    // Sometimes it might be triggered outside i.e. via metamask.
    this.ngZone.run(() => {
      removeItem(StorageItem.CustomToken);
      this.memberSubscription$?.unsubscribe();
      this.memberStakingSubscription$?.unsubscribe();
      this.isLoggedIn$.next(false);
      this.member$.next(undefined);
      this.memberLevel$.next(0);
      this.stopMetamaskListeners();
    });
  }

  setAuthMenu(memberId: string): void {
    setTimeout(() => {
      this.desktopMenuItems$.next([
        this.overviewMenuItem,
        this.discoverMenuItem,
        this.stakingMenuItem,
        this.tokenMenuItem,
        this.swapMenuItem,
        this.poolMenuItem,
        this.marketMenuItem,
        this.getMemberMenuItem(memberId),
      ]);

      this.mobileMenuItems$.next([
        this.overviewMenuItem,
        this.discoverMenuItem,
        this.stakingMenuItem,
        this.tokenMenuItem,
        this.swapMenuItem,
        this.poolMenuItem,
        this.marketMenuItem,
        this.getMemberMenuItem(memberId),
      ]);
    }, 1000);
  }

  setUnAuthMenu(): void {
    this.desktopMenuItems$.next([
      this.discoverMenuItem,
      this.stakingMenuItem,
      this.tokenMenuItem,
      this.swapMenuItem,
      this.poolMenuItem,
      this.marketMenuItem,
    ]);

    this.mobileMenuItems$.next([
      this.discoverMenuItem,
      this.stakingMenuItem,
      this.tokenMenuItem,
      this.swapMenuItem,
      this.poolMenuItem,
      this.marketMenuItem,
    ]);
  }

  public getMemberMenuItem(memberId: string): MenuItem {
    return {
      route: [ROUTER_UTILS.config.member.root, memberId],
      icon: UnamusedIconComponent,
      title: $localize`My Profile`,
      authSepeator: true,
      unAuthauthSepeator: false,
    };
  }
}
