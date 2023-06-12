import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthModule } from '@components/auth/auth.module';
import { IconModule } from '@components/icon/icon.module';
import { MenuModule } from '@components/menu/menu.module';
import { NftCheckoutModule } from '@components/nft/components/nft-checkout/nft-checkout.module';
import { CountdownTimeModule } from '@core/pipes/countdown-time/countdown-time.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { FormatTokenPipe } from '@core/pipes/formatToken/format-token.pipe';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { MobileHeaderModule } from '../mobile-header/mobile-header.module';
import { MobileMenuModule } from '../mobile-menu/mobile-menu.module';
import { TruncateModule } from './../../../@core/pipes/truncate/truncate.module';
import { HeaderComponent } from './header.component';

@NgModule({
  declarations: [HeaderComponent],
  providers: [FormatTokenPipe],
  imports: [
    CommonModule,
    TruncateModule,
    NzModalModule,
    AuthModule,
    FormatTokenModule,
    RouterModule,
    ResizeAvatarModule,
    NzToolTipModule,
    NzLayoutModule,
    NzIconModule,
    NzBadgeModule,
    NzButtonModule,
    NzAvatarModule,
    NzNotificationModule,
    NzTagModule,
    IconModule,
    CountdownTimeModule,
    NzDropDownModule,
    MenuModule,
    NftCheckoutModule,
    MobileMenuModule,
    MobileHeaderModule,
  ],
  exports: [HeaderComponent],
})
export class HeaderModule {}
