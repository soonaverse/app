import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { MenuModule } from '@components/menu/menu.module';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { CreateDropdownComponent } from './create-dropdown/create-dropdown.component';
import { MobileHeaderComponent } from './mobile-header.component';

@NgModule({
  declarations: [MobileHeaderComponent, CreateDropdownComponent],
  imports: [
    CommonModule,
    RouterModule,
    IconModule,
    NzDropDownModule,
    NzToolTipModule,
    NzButtonModule,
    NzBadgeModule,
    MenuModule,
  ],
  exports: [MobileHeaderComponent],
})
export class MobileHeaderModule {}
