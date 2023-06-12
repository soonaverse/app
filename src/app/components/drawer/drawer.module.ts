import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { DrawerComponent } from './drawer.component';

@NgModule({
  declarations: [DrawerComponent],
  imports: [CommonModule],
  exports: [DrawerComponent],
})
export class DrawerModule {}
