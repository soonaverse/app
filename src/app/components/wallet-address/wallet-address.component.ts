import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { DeviceService } from '@core/services/device';
import { MODAL_WIDTH } from '@core/utils/modal.util';
import { copyToClipboard } from '@core/utils/tools.utils';
import { environment } from '@env/environment';
import {
  DEFAULT_NETWORK,
  Member,
  Network,
  PROD_NETWORKS,
  Space,
  TEST_NETWORKS,
} from '@build-5/interfaces';

export enum EntityType {
  SPACE = 'SPACE',
  MEMBER = 'MEMBER',
}

@Component({
  selector: 'wen-wallet-address',
  templateUrl: './wallet-address.component.html',
  styleUrls: ['./wallet-address.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletAddressComponent {
  @Input() entityType?: EntityType;
  @Input() entity?: Space | Member | null;
  @Input() enableVerification = false;
  @Input() isManageAddressesOpen = false;
  @Output() wenOnManageAddressClose = new EventEmitter<void>();

  public verifyAddressOpen: Network | null = null;
  public networks = Network;
  public modalWidth = MODAL_WIDTH;
  public defaultNetwork = DEFAULT_NETWORK;
  public environment = environment;
  public isCopied: { [key in Network]?: boolean } = {};

  constructor(public deviceService: DeviceService, private cd: ChangeDetectorRef) {}

  public address(network?: Network): string | undefined {
    return (this.entity?.validatedAddress || {})[network || DEFAULT_NETWORK] || '';
  }

  public copyAddress(network: Network) {
    const address = this.address(network);
    if (!this.isCopied[network] && address) {
      copyToClipboard(address);
      this.isCopied[network] = true as never;
      setTimeout(() => {
        this.isCopied[network] = false;
        this.cd.markForCheck();
      }, 3000);
    }
  }

  public close(): void {
    this.verifyAddressOpen = null;
    this.cd.markForCheck();
  }

  public manageAddressClose(): void {
    this.isManageAddressesOpen = false;
    this.wenOnManageAddressClose.emit();
    this.cd.markForCheck();
  }

  public networkName(network: Network | null): string | undefined {
    return Object.entries(this.networks).find(([_key, value]) => value === network)?.[0];
  }

  public openVerification(n: Network): void {
    if (!this.isNetworkEnabled(n)) {
      alert($localize`This network is currently not enabled.`);
      return;
    }

    this.verifyAddressOpen = n;
    this.cd.markForCheck();
  }

  public isNetworkEnabled(n?: Network): boolean {
    if (!n) {
      return false;
    }

    if (environment.production) {
      return PROD_NETWORKS.includes(n);
    } else {
      return [...PROD_NETWORKS, ...TEST_NETWORKS].includes(n);
    }
  }

  public verifiedAddresses(): Network[] {
    return Object.keys(this.entity?.validatedAddress || {}) as Network[];
  }
}
