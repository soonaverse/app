import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { CollapseModule } from '@components/collapse/collapse.module';
import { IconModule } from '@components/icon/icon.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { DescriptionComponent } from './description.component';

@NgModule({
  declarations: [DescriptionComponent],
  imports: [CommonModule, NzCardModule, IconModule, CollapseModule, NzButtonModule],
  exports: [DescriptionComponent],
})
export class DescriptionModule {}
