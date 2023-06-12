import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-evm-chain',
  templateUrl: './evm-chain.component.html',
  styleUrls: ['./evm-chain.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EvmChainIconComponent {
  @Input() size = 24;
}
