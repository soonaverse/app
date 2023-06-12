import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { DropdownTabsComponent } from './dropdown-tabs.component';

@NgModule({
  declarations: [DropdownTabsComponent],
  imports: [CommonModule, RouterModule, NzButtonModule, NzDropDownModule, IconModule],
  exports: [DropdownTabsComponent],
})
export class DropdownTabsModule {}
