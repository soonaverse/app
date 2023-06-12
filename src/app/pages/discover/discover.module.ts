import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AlgoliaModule } from '@components/algolia/algolia.module';
import { CollapseModule } from '@components/collapse/collapse.module';
import { CollectionCardModule } from '@components/collection/components/collection-card/collection-card.module';
import { DrawerModule } from '@components/drawer/drawer.module';
import { DropdownTabsModule } from '@components/dropdown-tabs/dropdown-tabs.module';
import { IconModule } from '@components/icon/icon.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { SelectSpaceModule } from '@components/space/components/select-space/select-space.module';
import { TabsModule } from '@components/tabs/tabs.module';
import { OnVisibleModule } from '@core/directives/on-visible/on-visible.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { AwardModule } from '../../components/award/award.module';
import { MemberModule } from '../../components/member/member.module';
import { ProposalModule } from '../../components/proposal/proposals.module';
import { SpaceModule } from '../../components/space/space.module';
import { DiscoverRoutingModule } from './discover-routing.module';
import { AwardsPage } from './pages/awards/awards.page';
import { DiscoverPage } from './pages/discover/discover.page';
import { MembersPage } from './pages/members/members.page';
import { ProposalsPage } from './pages/proposals/proposals.page';
import { SpacesPage } from './pages/spaces/spaces.page';
import { FilterService } from './services/filter.service';

@NgModule({
  declarations: [DiscoverPage, SpacesPage, MembersPage, AwardsPage, ProposalsPage],
  exports: [],
  providers: [FilterService],
  imports: [
    CommonModule,
    InfiniteScrollModule,
    FormsModule,
    ReactiveFormsModule,
    TabsModule,
    OnVisibleModule,
    RouterModule,
    NzTypographyModule,
    DiscoverRoutingModule,
    NzInputModule,
    NzIconModule,
    NzButtonModule,
    SpaceModule,
    NzCardModule,
    NzSkeletonModule,
    NzSelectModule,
    NzToolTipModule,
    NzTagModule,
    MemberModule,
    ProposalModule,
    AwardModule,
    LayoutModule,
    DropdownTabsModule,
    IconModule,
    NzCheckboxModule,
    MobileSearchModule,
    SelectSpaceModule,
    CollectionCardModule,
    AlgoliaModule,
    CollapseModule,
    NzDrawerModule,
    DrawerModule,
  ],
})
export class DiscoverModule {}
