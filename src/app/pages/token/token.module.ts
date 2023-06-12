import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ConnectWalletModule } from '@components/connect-wallet/connect-wallet.module';
import { CountdownModule } from '@components/countdown/countdown.module';
import { DescriptionModule } from '@components/description/description.module';
import { DrawerToggleModule } from '@components/drawer-toggle/drawer-toggle.module';
import { IconModule } from '@components/icon/icon.module';
import { ModalDrawerModule } from '@components/modal-drawer/modal-drawer.module';
import { RadioModule } from '@components/radio/radio.module';
import { ShareModule } from '@components/share/share.module';
import { SelectSpaceModule } from '@components/space/components/select-space/select-space.module';
import { TabsModule } from '@components/tabs/tabs.module';
import { TokenAirdropNetworkModule } from '@components/token/components/token-airdrop-network/token-airdrop-network.module';
import { TokenBidModule } from '@components/token/components/token-bid/token-bid.module';
import { TokenCancelSaleModule } from '@components/token/components/token-cancel-sale/token-cancel-sale.module';
import { TokenCancelModule } from '@components/token/components/token-cancel/token-cancel.module';
import { TokenInfoDescriptionModule } from '@components/token/components/token-info/token-info-description.module';
import { TokenMintNetworkModule } from '@components/token/components/token-mint-network/token-mint-network.module';
import { TokenOfferMintModule } from '@components/token/components/token-offer-mint/token-offer-mint.module';
import { TokenOfferModule } from '@components/token/components/token-offer/token-offer.module';
import { TokenPublicSaleModule } from '@components/token/components/token-public-sale/token-public-sale.module';
import { TokenPurchaseModule } from '@components/token/components/token-purchase/token-purchase.module';
import { TokenRefundModule } from '@components/token/components/token-refund/token-refund.module';
import { TokenTradeDetailModalModule } from '@components/token/components/token-trade-detail-modal/token-trade-detail-modal.module';
import { TokenTradingPairsTableModule } from '@components/token/components/token-trading-pairs-table/token-trading-pairs-table.module';
import { TradingViewModule } from '@components/trading-view/components/trading-view/trading-view.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { MarkDownModule } from '@core/pipes/markdown/markdown.module';
import { ResizeAvatarModule } from '@core/pipes/resize-avatar/resize-avatar.module';
import { TruncateModule } from '@core/pipes/truncate/truncate.module';
import { UnknownIfZeroModule } from '@core/pipes/unknown-if-zero/unknown-if-zero.module';
import { UsdBelowTwoDecimalsModule } from '@core/pipes/usd-below-two-decimals/usd-below-two-decimals.module';
import { LayoutModule } from '@shell/ui/layout/layout.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSkeletonModule } from 'ng-zorro-antd/skeleton';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NgChartsModule } from 'ng2-charts';
import { AuditOneModule } from 'src/app/service-modules/audit-one/audit-one.module';
import { AirdropsPage } from './pages/airdrops/airdrops.page';
import { MetricsPage } from './pages/metrics/metrics.page';
import { NewIntroductionComponent } from './pages/new/introduction/introduction.component';
import { NewMetricsComponent } from './pages/new/metrics/metrics.component';
import { NewPage } from './pages/new/new.page';
import { NewOverviewComponent } from './pages/new/overview/overview.component';
import { NewSummaryComponent } from './pages/new/summary/summary.component';
import { OverviewPage } from './pages/overview/overview.page';
import { TokenBuyComponent } from './pages/token/token-buy/token-buy.component';
import { TokenEditComponent } from './pages/token/token-edit/token-edit.component';
import { TokenInfoComponent } from './pages/token/token-info/token-info.component';
import { TokenProgressComponent } from './pages/token/token-progress/token-progress.component';
import { TokenPage } from './pages/token/token.page';
import { TradePage } from './pages/trade/trade.page';
import { HelperService } from './services/helper.service';
import { TokenRoutingModule } from './token-routing.module';

@NgModule({
  declarations: [
    OverviewPage,
    TokenPage,
    MetricsPage,
    AirdropsPage,
    NewPage,
    TokenInfoComponent,
    NewMetricsComponent,
    NewOverviewComponent,
    NewSummaryComponent,
    TokenBuyComponent,
    TokenProgressComponent,
    NewIntroductionComponent,
    TradePage,
    TokenEditComponent,
  ],
  providers: [DecimalPipe, PercentPipe, HelperService],
  imports: [
    CommonModule,
    TradingViewModule,
    TokenRoutingModule,
    TabsModule,
    LayoutModule,
    ShareModule,
    NzProgressModule,
    UnknownIfZeroModule,
    IconModule,
    NzCardModule,
    DrawerToggleModule,
    NzAvatarModule,
    NzTagModule,
    NzDrawerModule,
    NzModalModule,
    NzGridModule,
    TruncateModule,
    NzToolTipModule,
    NzButtonModule,
    MarkDownModule,
    NgChartsModule,
    TokenPurchaseModule,
    FormatTokenModule,
    UsdBelowTwoDecimalsModule,
    NzUploadModule,
    NzIconModule,
    NzTableModule,
    FormsModule,
    ReactiveFormsModule,
    NzInputModule,
    NzFormModule,
    NzDatePickerModule,
    NzSelectModule,
    NzCheckboxModule,
    SelectSpaceModule,
    RadioModule,
    NzRadioModule,
    DescriptionModule,
    CountdownModule,
    TokenPublicSaleModule,
    NzSkeletonModule,
    TokenBidModule,
    TokenOfferMintModule,
    TokenRefundModule,
    AuditOneModule,
    TokenOfferModule,
    ModalDrawerModule,
    NgChartsModule,
    ResizeAvatarModule,
    TokenInfoDescriptionModule,
    TokenCancelSaleModule,
    TokenMintNetworkModule,
    TokenCancelModule,
    ConnectWalletModule,
    TokenTradeDetailModalModule,
    NzDropDownModule,
    TokenTradingPairsTableModule,
    TokenAirdropNetworkModule,
  ],
})
export class TokenModule {}
