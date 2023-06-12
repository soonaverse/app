import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { FixedCreateButtonComponent } from './fixed-create-button.component';

@NgModule({
  declarations: [FixedCreateButtonComponent],
  imports: [CommonModule, IconModule, RouterModule],
  exports: [FixedCreateButtonComponent],
})
export class FixedCreateButtonModule {}
