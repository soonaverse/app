import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { IotaInputComponent } from './iota-input.component';

@NgModule({
  declarations: [IotaInputComponent],
  imports: [
    CommonModule,
    NzInputModule,
    FormatTokenModule,
    NzInputNumberModule,
    NzFormModule,
    NzToolTipModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzIconModule,
  ],
  exports: [IotaInputComponent],
})
export class IotaInputModule {}
