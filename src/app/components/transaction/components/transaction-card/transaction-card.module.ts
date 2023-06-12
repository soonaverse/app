import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { TransactionCardComponent } from './transaction-card.component';

@NgModule({
  declarations: [TransactionCardComponent],
  imports: [CommonModule, NzAvatarModule, TruncateModule],
  exports: [TransactionCardComponent],
})
export class TransactionCardModule {}
