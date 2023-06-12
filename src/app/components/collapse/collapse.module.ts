import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { NzCardModule } from 'ng-zorro-antd/card';
import { CollapseComponent } from './collapse.component';

@NgModule({
  declarations: [CollapseComponent],
  imports: [CommonModule, NzCardModule, IconModule],
  exports: [CollapseComponent],
})
export class CollapseModule {}
