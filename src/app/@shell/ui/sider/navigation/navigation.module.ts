import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { MenuModule } from '../menu/menu.module';
import { NavigationComponent } from './navigation.component';

@NgModule({
  declarations: [NavigationComponent],
  imports: [CommonModule, NzPopoverModule, RouterModule, MenuModule, IconModule],
  exports: [NavigationComponent],
})
export class NavigationModule {}
