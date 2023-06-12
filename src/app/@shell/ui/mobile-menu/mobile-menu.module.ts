import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { MobileHeaderModule } from '../mobile-header/mobile-header.module';
import { MenuModule } from '../sider/menu/menu.module';
import { NavigationModule } from '../sider/navigation/navigation.module';
import { NetworkStatusModule } from '../sider/network-status/network-status.module';
import { ThemeSwitchModule } from '../sider/theme-switch/theme-switch.module';
import { MobileMenuComponent } from './mobile-menu.component';

@NgModule({
  declarations: [MobileMenuComponent],
  imports: [
    CommonModule,
    MobileHeaderModule,
    NzDrawerModule,
    NzAvatarModule,
    IconModule,
    TruncateModule,
    NzTagModule,
    ResizeAvatarModule,
    MenuModule,
    ThemeSwitchModule,
    NzIconModule,
    NzToolTipModule,
    NetworkStatusModule,
    NavigationModule,
  ],
  exports: [MobileMenuComponent],
})
export class MobileMenuModule {}
