import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { environment } from '@env/environment';
import {
  DEFAULT_NETWORK,
  Member,
  NETWORK_DETAIL,
  Network,
  PROD_NETWORKS,
  Space,
  TEST_NETWORKS,
} from '@build-5/interfaces';

@Component({
  selector: 'wen-manage-addresses',
  templateUrl: './manage-addresses.component.html',
  styleUrls: ['./manage-addresses.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageAddressesComponent {
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() entity?: Space | Member | null;
  @Output() wenOnChange = new EventEmitter<Network>();
  @Output() wenOnClose = new EventEmitter<void>();
  public networks = Network;
  public availableNetworks = environment.production
    ? PROD_NETWORKS
    : [...PROD_NETWORKS, ...TEST_NETWORKS];

  private _isOpen = false;

  constructor(public deviceService: DeviceService) {}

  public close(): void {
    this.isOpen = false;
    this.wenOnClose.next();
  }

  public networkName(network: Network | null): string | undefined {
    return Object.entries(this.networks).find(([_key, value]) => value === network)?.[0];
  }

  public address(network?: Network): string | undefined {
    return (this.entity?.validatedAddress || {})[network || DEFAULT_NETWORK] || '';
  }

  public get networkDetails(): typeof NETWORK_DETAIL {
    return NETWORK_DETAIL;
  }
}
