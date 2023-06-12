import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Network } from '@build-5/interfaces';

@Component({
  selector: 'wen-selected-network',
  templateUrl: './selected-network.component.html',
  styleUrls: ['./selected-network.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectedNetworkComponent {
  @Input() public selectedNetwork?: string;

  public get networkTypes(): typeof Network {
    return Network;
  }
}
