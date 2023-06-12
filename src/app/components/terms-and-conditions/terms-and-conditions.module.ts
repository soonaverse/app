import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { TermsAndConditionsComponent } from './terms-and-conditions.component';

@NgModule({
  declarations: [TermsAndConditionsComponent],
  imports: [CommonModule, NzCheckboxModule],
  exports: [TermsAndConditionsComponent],
})
export class TermsAndConditionsModule {}
