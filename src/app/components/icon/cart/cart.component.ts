import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-icon-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartIconComponent {}
