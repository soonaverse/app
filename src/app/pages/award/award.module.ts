import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AwardAwardsModule } from '@components/award/components/award-awards/award-awards.module';
import { AwardMintModule } from '@components/award/components/award-mint/award-mint.module';
import { DrawerToggleModule } from '@components/drawer-toggle/drawer-toggle.module';
import { IconModule } from '@components/icon/icon.module';
import { MemberCardModule } from '@components/member/components/member-card/member-card.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { RadioModule } from '@components/radio/radio.module';
import { ShareModule } from '@components/share/share.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { AwardInfoModule } from '@pages/award/pages/award/award-info/award-info.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { IpfsBadgeModule } from './../../@core/pipes/ipfs-badge/ipfs-badge.module';
import { MarkDownModule } from './../../@core/pipes/markdown/markdown.module';
import { TruncateModule } from './../../@core/pipes/truncate/truncate.module';
import { AwardStatusModule } from './../../components/award/components/award-status/award-status.module';
import { TabsModule } from './../../components/tabs/tabs.module';
import { AwardRoutingModule } from './award-routing.module';
import { AwardPage } from './pages/award/award.page';
import { NewPage } from './pages/new/new.page';
import { OverviewPage } from './pages/overview/overview.page';
import { ParticipantsPage } from './pages/participants/participants.page';
import { DataService } from './services/data.service';

@NgModule({
  declarations: [NewPage, AwardPage, OverviewPage, ParticipantsPage],
  providers: [DataService],
  imports: [
    CommonModule,
    TabsModule,
    TruncateModule,
    LayoutModule,
    InfiniteScrollModule,
    FormatTokenModule,
    IpfsBadgeModule,
    AwardRoutingModule,
    MarkDownModule,
    ResizeAvatarModule,
    ReactiveFormsModule,
    MemberCardModule,
    NzButtonModule,
    NzSelectModule,
    NzRadioModule,
    RadioModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzAvatarModule,
    NzGridModule,
    NzMenuModule,
    NzTypographyModule,
    NzTagModule,
    NzFormModule,
    AwardStatusModule,
    NzModalModule,
    NzSkeletonModule,
    NzUploadModule,
    NzDropDownModule,
    NzAlertModule,
    NzInputNumberModule,
    NzToolTipModule,
    NzDatePickerModule,
    IconModule,
    DrawerToggleModule,
    NzDrawerModule,
    AwardInfoModule,
    AwardAwardsModule,
    AwardMintModule,
    MobileSearchModule,
    FormsModule,
    ShareModule,
  ],
})
export class AwardModule {}
