import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AlgoliaModule } from '@components/algolia/algolia.module';
import { IconModule } from '@components/icon/icon.module';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { TokenTradingPairRowModule } from '../token-trading-pair-row/token-trading-pair-row.module';
import { TokenTradingPairsTableComponent } from './token-trading-pairs-table.component';

@NgModule({
  declarations: [TokenTradingPairsTableComponent],
  imports: [
    CommonModule,
    NzInputModule,
    NzFormModule,
    IconModule,
    AlgoliaModule,
    TokenTradingPairRowModule,
  ],
  exports: [TokenTradingPairsTableComponent],
})
export class TokenTradingPairsTableModule {}
