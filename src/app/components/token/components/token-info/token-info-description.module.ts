import { CommonModule, PercentPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { DescriptionModule } from '@components/description/description.module';
import { IconModule } from '@components/icon/icon.module';
import { FormatTokenModule } from '@core/pipes/formatToken/format-token.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { TokenInfoDescriptionComponent } from './token-info-description.component';

@NgModule({
  declarations: [TokenInfoDescriptionComponent],
  imports: [CommonModule, DescriptionModule, NzAvatarModule, IconModule, FormatTokenModule],
  providers: [PercentPipe],
  exports: [TokenInfoDescriptionComponent],
})
export class TokenInfoDescriptionModule {}
