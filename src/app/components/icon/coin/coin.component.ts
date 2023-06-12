import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-coin',
  templateUrl: './coin.component.html',
  styleUrls: ['./coin.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CoinIconComponent {
  @Input() size = 24;
}
