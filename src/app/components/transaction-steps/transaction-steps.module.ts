import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { TransactionStepsComponent } from './transaction-steps.component';

@NgModule({
  declarations: [TransactionStepsComponent],
  imports: [CommonModule, IconModule],
  exports: [TransactionStepsComponent],
})
export class TransactionStepsModule {}
