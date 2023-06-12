import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AwardCardModule } from '@components/award/components/award-card/award-card.module';
import { CollectionCardModule } from '@components/collection/components/collection-card/collection-card.module';
import { DescriptionModule } from '@components/description/description.module';
import { DrawerToggleModule } from '@components/drawer-toggle/drawer-toggle.module';
import { IconModule } from '@components/icon/icon.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { RadioModule } from '@components/radio/radio.module';
import { SpaceRewardScheduleModule } from '@components/space/components/space-reward-schedule/space-reward-schedule.module';
import { TokenCardModule } from '@components/token/components/token-card/token-card.module';
import { TokenImportModule } from '@components/token/components/token-import/token-import.module';
import { TokenStakeModule } from '@components/token/components/token-stake/token-stake.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { SpaceAboutModule } from '@pages/space/pages/space/space-about/space-about.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AuditOneModule } from 'src/app/service-modules/audit-one/audit-one.module';
import { ResizeAvatarModule } from '../../@core/pipes/resize-avatar/resize-avatar.module';
import { MemberModule } from '../../components/member/member.module';
import { ProposalCardModule } from '../../components/proposal/components/proposal-card/proposal-card.module';
import { MarkDownModule } from './../../@core/pipes/markdown/markdown.module';
import { TruncateModule } from './../../@core/pipes/truncate/truncate.module';
import { FixedCreateButtonModule } from './../../components/fixed-create-button/fixed-create-button.module';
import { TabsModule } from './../../components/tabs/tabs.module';
import { AwardsPage } from './pages/awards/awards.page';
import { CollectionsPage } from './pages/collections/collections.page';
import { ManagePage } from './pages/manage/manage.page';
import { MembersPage } from './pages/members/members.page';
import { OverviewPage } from './pages/overview/overview.page';
import { ProposalsPage } from './pages/proposals/proposals.page';
import { SpacePage } from './pages/space/space.page';
import { UpsertPage } from './pages/upsert/upsert.page';
import { DataService } from './services/data.service';
import { SpaceRoutingModule } from './space-routing.module';

@NgModule({
  declarations: [
    SpacePage,
    OverviewPage,
    ManagePage,
    ProposalsPage,
    AwardsPage,
    MembersPage,
    UpsertPage,
    CollectionsPage,
  ],
  providers: [DataService],
  imports: [
    CommonModule,
    TabsModule,
    MarkDownModule,
    InfiniteScrollModule,
    SpaceRewardScheduleModule,
    ReactiveFormsModule,
    SpaceRoutingModule,
    TruncateModule,
    NzInputNumberModule,
    MemberModule,
    ResizeAvatarModule,
    ProposalCardModule,
    AwardCardModule,
    IconModule,
    NzTagModule,
    NzRadioModule,
    NzBadgeModule,
    NzDropDownModule,
    NzFormModule,
    NzGridModule,
    NzButtonModule,
    NzTypographyModule,
    NzSkeletonModule,
    NzCardModule,
    NzInputModule,
    NzTableModule,
    AuditOneModule,
    NzSelectModule,
    NzToolTipModule,
    NzIconModule,
    FormatTokenModule,
    NzTagModule,
    NzAlertModule,
    DescriptionModule,
    TokenImportModule,
    NzUploadModule,
    NzAvatarModule,
    LayoutModule,
    NzToolTipModule,
    NzListModule,
    IconModule,
    RadioModule,
    DrawerToggleModule,
    NzDrawerModule,
    SpaceAboutModule,
    FixedCreateButtonModule,
    FormsModule,
    CollectionCardModule,
    MobileSearchModule,
    TokenCardModule,
    TokenStakeModule,
    ModalDrawerModule,
  ],
})
export class SpaceModule {}
