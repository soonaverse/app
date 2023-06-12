import { CommonModule, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CountdownModule } from '@components/countdown/countdown.module';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { TokenCardComponent } from './token-card.component';

@NgModule({
  declarations: [TokenCardComponent],
  imports: [
    CommonModule,
    RouterModule,
    NzAvatarModule,
    IconModule,
    NzProgressModule,
    FormatTokenModule,
    CountdownModule,
  ],
  providers: [PercentPipe],
  exports: [TokenCardComponent],
})
export class TokenCardModule {}
