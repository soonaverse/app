import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { environment } from '@env/environment';
import {
  Network,
  PROD_AVAILABLE_MINTABLE_NETWORKS,
  PROD_NETWORKS,
  TEST_AVAILABLE_MINTABLE_NETWORKS,
  TEST_NETWORKS,
} from '@build-5/interfaces';

@Component({
  selector: 'wen-select-network',
  templateUrl: './select-network.component.html',
  styleUrls: ['./select-network.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectNetworkComponent {
  @Input() public selectedNetwork?: Network;
  @Input() public title?: string;

  @Output() public selectNetwork: EventEmitter<Network> = new EventEmitter();
  public environment = environment;

  public isNetworkEnabled(n?: Network): boolean {
    if (!n) {
      return false;
    }

    if (environment.production) {
      return PROD_AVAILABLE_MINTABLE_NETWORKS.includes(n) && PROD_NETWORKS.includes(n);
    } else {
      return (
        [...PROD_AVAILABLE_MINTABLE_NETWORKS, ...TEST_AVAILABLE_MINTABLE_NETWORKS].includes(n) &&
        [...PROD_NETWORKS, ...TEST_NETWORKS].includes(n)
      );
    }
  }

  public get networkTypes(): typeof Network {
    return Network;
  }
}
