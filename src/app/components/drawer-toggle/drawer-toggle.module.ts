import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DrawerToggleComponent } from './drawer-toggle.component';

@NgModule({
  declarations: [DrawerToggleComponent],
  imports: [CommonModule],
  exports: [DrawerToggleComponent],
})
export class DrawerToggleModule {}
