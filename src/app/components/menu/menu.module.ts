import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { MenuComponent } from './menu.component';

@NgModule({
  declarations: [MenuComponent, MenuItemComponent],
  imports: [CommonModule, RouterModule, NzMenuModule],
  exports: [MenuComponent, MenuItemComponent],
})
export class MenuModule {}
