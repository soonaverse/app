import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from './../../../../components/icon/icon.module';
import { ThemeSwitchComponent } from './theme-switch.component';

@NgModule({
  declarations: [ThemeSwitchComponent],
  imports: [CommonModule, IconModule],
  exports: [ThemeSwitchComponent],
})
export class ThemeSwitchModule {}
