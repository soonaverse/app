import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-open-sale',
  templateUrl: './open-sale.component.html',
  styleUrls: ['./open-sale.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OpenSaleIconComponent {
  @Input() size = 24;
}
