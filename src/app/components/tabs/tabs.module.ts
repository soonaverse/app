import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { TabsComponent } from './tabs.component';

@NgModule({
  exports: [TabsComponent],
  declarations: [TabsComponent],
  imports: [CommonModule, RouterModule, NzMenuModule],
})
export class TabsModule {}
