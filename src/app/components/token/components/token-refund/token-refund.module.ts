import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { TermsAndConditionsModule } from '@components/terms-and-conditions/terms-and-conditions.module';
import { RelativeTimeModule } from '@core/pipes/relative-time/relative-time.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { TokenRefundComponent } from './token-refund.component';

@NgModule({
  declarations: [TokenRefundComponent],
  imports: [
    CommonModule,
    NzModalModule,
    NzDrawerModule,
    IconModule,
    NzButtonModule,
    NzCheckboxModule,
    NzAvatarModule,
    NzInputModule,
    FormsModule,
    ReactiveFormsModule,
    ModalDrawerModule,
    TermsAndConditionsModule,
    RelativeTimeModule,
  ],
  exports: [TokenRefundComponent],
})
export class TokenRefundModule {}
