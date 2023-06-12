import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { MenuModule } from '@components/menu/menu.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { SignInModalComponent } from './components/sign-in-modal/sign-in-modal.component';
import { SignInComponent } from './components/sign-in/sign-in.component';
import { SignOutComponent } from './components/sign-out/sign-out.component';

@NgModule({
  declarations: [SignInComponent, SignOutComponent, SignInModalComponent],
  exports: [SignInComponent, SignOutComponent, SignInModalComponent],
  imports: [
    CommonModule,
    NzAvatarModule,
    NzTypographyModule,
    NzButtonModule,
    NzIconModule,
    IconModule,
    NzNotificationModule,
    NzModalModule,
    MenuModule,
  ],
})
export class AuthModule {}
