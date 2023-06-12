import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlgoliaModule } from '@components/algolia/algolia.module';
import { SelectCollectionModule } from '@components/collection/components/select-collection/select-collection.module';
import { DrawerToggleModule } from '@components/drawer-toggle/drawer-toggle.module';
import { MemberAboutModule } from '@components/member/components/member-about/member-about.module';
import { MemberSpaceRowModule } from '@components/member/components/member-space-row/member-space-row.module';
import { MemberTileModule } from '@components/member/components/tile/member-tile.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { NftCardModule } from '@components/nft/components/nft-card/nft-card.module';
import { NftDepositModule } from '@components/nft/components/nft-deposit/nft-deposit.module';
import { NftStakeModule } from '@components/nft/components/nft-stake/nft-stake.module';
import { SelectSpaceModule } from '@components/space/components/select-space/select-space.module';
import { TimelineModule } from '@components/timeline/timeline.module';
import { LockedTokenClaimModule } from '@components/token/components/locked-token-claim/locked-token-claim.module';
import { TokenClaimModule } from '@components/token/components/token-claim/token-claim.module';
import { TokenRefundModule } from '@components/token/components/token-refund/token-refund.module';
import { TokenRowModule } from '@components/token/components/token-row/token-row.module';
import { TokenStakeModule } from '@components/token/components/token-stake/token-stake.module';
import { TokenTradingPairsTableModule } from '@components/token/components/token-trading-pairs-table/token-trading-pairs-table.module';
import { TransactionCardModule } from '@components/transaction/components/transaction-card/transaction-card.module';
import { OnVisibleModule } from '@core/directives/on-visible/on-visible.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { IpfsBadgeModule } from '@core/pipes/ipfs-badge/ipfs-badge.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { ResizeAvatarPipe } from '@core/pipes/resize-avatar/resize-avatar.pipe';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzListModule } from 'ng-zorro-antd/list';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTimelineModule } from 'ng-zorro-antd/timeline';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AuditOneModule } from 'src/app/service-modules/audit-one/audit-one.module';
import { AwardCardModule } from '../../components/award/components/award-card/award-card.module';
import { TruncateModule } from './../../@core/pipes/truncate/truncate.module';
import { BadgeModule } from './../../components/badge/badge.module';
import { IconModule } from './../../components/icon/icon.module';
import { TabsModule } from './../../components/tabs/tabs.module';
import { UserRoutingModule } from './member-routing.module';
import { ActivityPage } from './pages/activity/activity.page';
import { AwardsPage } from './pages/awards/awards.page';
import { BadgesPage } from './pages/badges/badges.page';
import { MemberPage } from './pages/member/member.page';
import { NFTsPage } from './pages/nfts/nfts.page';
import { MemberSpacesComponent } from './pages/spaces/member-spaces.component';
import { TokensPage } from './pages/tokens/tokens.page';
import { TransactionsPage } from './pages/transactions/transactions.page';
import { DataService } from './services/data.service';

@NgModule({
  declarations: [
    MemberPage,
    ActivityPage,
    AwardsPage,
    BadgesPage,
    MemberSpacesComponent,
    NFTsPage,
    TokensPage,
    TransactionsPage,
  ],
  providers: [DataService, ResizeAvatarPipe],
  imports: [
    CommonModule,
    BadgeModule,
    AwardCardModule,
    TabsModule,
    ResizeAvatarModule,
    MemberAboutModule,
    TruncateModule,
    LockedTokenClaimModule,
    UserRoutingModule,
    NzTagModule,
    NzButtonModule,
    NzTimelineModule,
    NzAvatarModule,
    NzCardModule,
    NzGridModule,
    NzDropDownModule,
    NzDrawerModule,
    NzTypographyModule,
    NzToolTipModule,
    NzIconModule,
    NzListModule,
    IconModule,
    LayoutModule,
    FormatTokenModule,
    NzModalModule,
    DrawerToggleModule,
    NzCheckboxModule,
    FormsModule,
    ReactiveFormsModule,
    NzInputModule,
    MemberSpaceRowModule,
    MemberTileModule,
    AuditOneModule,
    MobileSearchModule,
    IpfsBadgeModule,
    SelectSpaceModule,
    NftCardModule,
    NzSkeletonModule,
    InfiniteScrollModule,
    NzSelectModule,
    SelectCollectionModule,
    NzTableModule,
    TokenClaimModule,
    TokenRefundModule,
    TokenStakeModule,
    TransactionCardModule,
    TokenRowModule,
    OnVisibleModule,
    TimelineModule,
    AlgoliaModule,
    NftDepositModule,
    NftStakeModule,
    TokenTradingPairsTableModule,
  ],
})
export class MemberModule {}
