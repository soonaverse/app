import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ShareComponent } from './share.component';

@NgModule({
  declarations: [ShareComponent],
  imports: [CommonModule, NzButtonModule, IconModule],
  exports: [ShareComponent],
})
export class ShareModule {}
