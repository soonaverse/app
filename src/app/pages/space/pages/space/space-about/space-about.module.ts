import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DescriptionModule } from '@components/description/description.module';
import { IconModule } from '@components/icon/icon.module';
import { ShareModule } from '@components/share/share.module';
import { SpaceClaimModule } from '@components/space/components/space-claim/space-claim.module';
import { TokenClaimModule } from '@components/token/components/token-claim/token-claim.module';
import { TokenInfoDescriptionModule } from '@components/token/components/token-info/token-info-description.module';
import { TokenStakeModule } from '@components/token/components/token-stake/token-stake.module';
import { WalletAddressModule } from '@components/wallet-address/wallet-address.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { AuditOneModule } from 'src/app/service-modules/audit-one/audit-one.module';
import { MarkDownModule } from '../../../../../@core/pipes/markdown/markdown.module';
import { SpaceAboutComponent } from './space-about.component';

@NgModule({
  declarations: [SpaceAboutComponent],
  imports: [
    CommonModule,
    MarkDownModule,
    NzCardModule,
    IconModule,
    NzAvatarModule,
    FormatTokenModule,
    RouterModule,
    NzTagModule,
    TruncateModule,
    ResizeAvatarModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    NzSelectModule,
    AuditOneModule,
    NzToolTipModule,
    FormsModule,
    ReactiveFormsModule,
    NzInputNumberModule,
    NzNotificationModule,
    NzDrawerModule,
    WalletAddressModule,
    ShareModule,
    DescriptionModule,
    TokenStakeModule,
    TokenClaimModule,
    SpaceClaimModule,
    TokenInfoDescriptionModule,
  ],
  exports: [SpaceAboutComponent],
})
export class SpaceAboutModule {}
