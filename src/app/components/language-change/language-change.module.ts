import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@components/icon/icon.module';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { LanguageChangeComponent } from './language-change.component';

@NgModule({
  declarations: [LanguageChangeComponent],
  imports: [CommonModule, NzSelectModule, IconModule, FormsModule, ReactiveFormsModule],
  exports: [LanguageChangeComponent],
})
export class LanguageChangeModule {}
