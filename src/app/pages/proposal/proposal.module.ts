import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BadgeModule } from '@components/badge/badge.module';
import { DescriptionModule } from '@components/description/description.module';
import { DrawerToggleModule } from '@components/drawer-toggle/drawer-toggle.module';
import { IconModule } from '@components/icon/icon.module';
import { MemberCardModule } from '@components/member/components/member-card/member-card.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { ProposalAnswerModule } from '@components/proposal/components/proposal-answer/proposal-answer.module';
import { RadioModule } from '@components/radio/radio.module';
import { ShareModule } from '@components/share/share.module';
import { TabsModule } from '@components/tabs/tabs.module';
import { TokenVoteModule } from '@components/token/components/token-vote/token-vote.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { MarkDownModule } from './../../@core/pipes/markdown/markdown.module';
import { RelativeTimeModule } from './../../@core/pipes/relative-time/relative-time.module';
import { TruncateModule } from './../../@core/pipes/truncate/truncate.module';
import { ProposalStatusModule } from './../../components/proposal/components/proposal-status/proposal-status.module';
import { NewPage } from './pages/new/new.page';
import { OverviewPage } from './pages/overview/overview.page';
import { ProposalVoteActionComponent } from './pages/overview/proposal-vote-action/proposal-vote-action.component';
import { ParticipantsPage } from './pages/participants/participants.page';
import { ProposalInfoComponent } from './pages/proposal/proposal-info/proposal-info.component';
import { ProposalPage } from './pages/proposal/proposal.page';
import { VotesPage } from './pages/votes/votes.page';
import { ProposalRoutingModule } from './proposal-routing.module';
import { DataService } from './services/data.service';

@NgModule({
  declarations: [
    ProposalPage,
    OverviewPage,
    VotesPage,
    ParticipantsPage,
    NewPage,
    ProposalInfoComponent,
    ProposalVoteActionComponent,
  ],
  providers: [DataService],
  imports: [
    CommonModule,
    ProposalRoutingModule,
    MemberCardModule,
    ProposalStatusModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzNotificationModule,
    BadgeModule,
    TabsModule,
    RelativeTimeModule,
    InfiniteScrollModule,
    MarkDownModule,
    TruncateModule,
    ResizeAvatarModule,
    NzRadioModule,
    NzButtonModule,
    NzToolTipModule,
    LayoutModule,
    NzCardModule,
    NzIconModule,
    NzInputModule,
    NzAvatarModule,
    NzGridModule,
    NzFormModule,
    NzToolTipModule,
    NzMenuModule,
    NzAlertModule,
    NzTagModule,
    NzSkeletonModule,
    NzTypographyModule,
    NzProgressModule,
    FormatTokenModule,
    NzTableModule,
    NzTagModule,
    NzInputNumberModule,
    NzDividerModule,
    NzDatePickerModule,
    IconModule,
    RadioModule,
    DrawerToggleModule,
    NzDrawerModule,
    ProposalAnswerModule,
    MobileSearchModule,
    FormsModule,
    TokenVoteModule,
    ShareModule,
    DescriptionModule,
    ModalDrawerModule,
  ],
})
export class ProposalModule {}
