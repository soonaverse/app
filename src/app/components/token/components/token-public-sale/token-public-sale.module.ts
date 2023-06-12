import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DescriptionModule } from '@components/description/description.module';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { RadioModule } from '@components/radio/radio.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { TokenPublicSaleComponent } from './token-public-sale.component';

@NgModule({
  declarations: [TokenPublicSaleComponent],
  imports: [
    CommonModule,
    ModalDrawerModule,
    IconModule,
    NzFormModule,
    NzDatePickerModule,
    NzSelectModule,
    FormsModule,
    ReactiveFormsModule,
    DescriptionModule,
    FormatTokenModule,
    NzButtonModule,
    RadioModule,
    NzRadioModule,
  ],
  exports: [TokenPublicSaleComponent],
})
export class TokenPublicSaleModule {}
