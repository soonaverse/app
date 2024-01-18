import { Component, Input } from '@angular/core';
import { CartItem } from './../../services/cart.service';

@Component({
  selector: 'app-checkout-overlay',
  templateUrl: './checkout-overlay.component.html',
  styleUrls: ['./checkout-overlay.component.less'],
})
export class CheckoutOverlayComponent {
  @Input() items: CartItem[] = [];
  // Implement your payment form logic here

  // ... other methods
}
