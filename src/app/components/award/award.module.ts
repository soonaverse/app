import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { AwardCardModule } from './components/award-card/award-card.module';
import { AwardStatusModule } from './components/award-status/award-status.module';

@NgModule({
  exports: [AwardCardModule, AwardStatusModule],
  imports: [CommonModule],
})
export class AwardModule {}
