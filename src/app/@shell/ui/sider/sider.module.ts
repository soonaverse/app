import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { LanguageChangeModule } from '@components/language-change/language-change.module';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { IconModule } from './../../../components/icon/icon.module';
import { MenuModule } from './menu/menu.module';
import { NavigationModule } from './navigation/navigation.module';
import { NetworkStatusModule } from './network-status/network-status.module';
import { SiderComponent } from './sider.component';
import { ThemeSwitchModule } from './theme-switch/theme-switch.module';

@NgModule({
  declarations: [SiderComponent],
  imports: [
    CommonModule,
    IconModule,
    NzLayoutModule,
    NzIconModule,
    NzMenuModule,
    NzToolTipModule,
    RouterModule,
    ThemeSwitchModule,
    MenuModule,
    LanguageChangeModule,
    NetworkStatusModule,
    NavigationModule,
  ],
  exports: [SiderComponent],
})
export class SiderModule {}
