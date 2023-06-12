import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzPopoverModule } from 'ng-zorro-antd/popover';
import { MenuItemDirective } from './menu-item.directive';
import { MenuComponent } from './menu.component';

@NgModule({
  declarations: [MenuComponent, MenuItemDirective],
  imports: [CommonModule, RouterModule, NzMenuModule, NzPopoverModule],
  exports: [MenuComponent, MenuItemDirective],
})
export class MenuModule {}
