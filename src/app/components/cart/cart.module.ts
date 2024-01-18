import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CartModalComponent } from './components/cart-modal/cart-modal.component';
import { IconModule } from '@components/icon/icon.module';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
//import { NftRoutingModule } from '@pages/nft/nft-routing.module';
//import { CollectionRoutingModule } from '@pages/collection/collection-routing.module';
import { CheckoutOverlayComponent } from './components/checkout/checkout-overlay.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';

@NgModule({
  declarations: [
    CartModalComponent,
    CheckoutOverlayComponent,
  ],
  imports: [
    CommonModule,
    NzModalModule,
    NzButtonModule,
    IconModule,
    NzNotificationModule,
    FormatTokenModule,
    //NftRoutingModule,
    //CollectionRoutingModule,
    FormsModule,
    NzInputNumberModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
  ],
  exports: [CartModalComponent],
})
export class CartModule {}
