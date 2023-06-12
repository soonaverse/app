import { CommonModule, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AlgoliaModule } from '@components/algolia/algolia.module';
import { IconModule } from '@components/icon/icon.module';
import { MobileSearchModule } from '@components/mobile-search/mobile-search.module';
import { TabsModule } from '@components/tabs/tabs.module';
import { TokenAllTokenRowModule } from '@components/token/components/token-all-token-row/token-all-token-row.module';
import { TokenHighlightCardModule } from '@components/token/components/token-highlight-card/token-highlight-card.module';
import { TokenLaunchpadRowModule } from '@components/token/components/token-launchpad-row/token-launchpad-row.module';
import { TokenRowModule } from '@components/token/components/token-row/token-row.module';
import { TokenTradingPairRowModule } from '@components/token/components/token-trading-pair-row/token-trading-pair-row.module';
import { OnVisibleModule } from '@core/directives/on-visible/on-visible.module';
import { HelperService } from '@pages/token/services/helper.service';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NgAisToggleModule } from 'angular-instantsearch';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';

import { AllTokensPage } from './pages/all-tokens/all-tokens.page';
import { FavouritesPage } from './pages/favourites/favourites.page';
import { LaunchpadPage } from './pages/launchpad/launchpad.page';
import { TokensPage } from './pages/tokens/tokens.page';
import { TradingPairsPage } from './pages/trading-pairs/trading-pairs.page';
import { TokensRoutingModule } from './tokens-routing.module';

@NgModule({
  declarations: [TokensPage, FavouritesPage, AllTokensPage, TradingPairsPage, LaunchpadPage],
  imports: [
    CommonModule,
    TokensRoutingModule,
    NzCardModule,
    LayoutModule,
    AlgoliaModule,
    IconModule,
    TokenHighlightCardModule,
    TokenRowModule,
    InfiniteScrollModule,
    NzInputModule,
    NzSkeletonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    TabsModule,
    MobileSearchModule,
    TokenTradingPairRowModule,
    TokenAllTokenRowModule,
    TokenLaunchpadRowModule,
    NzButtonModule,
    PercentPipe,
    OnVisibleModule,
    NgAisToggleModule,
  ],
  providers: [PercentPipe, HelperService],
})
export class TokensModule {}
