import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ProposalCardModule } from './components/proposal-card/proposal-card.module';
import { ProposalStatusModule } from './components/proposal-status/proposal-status.module';

@NgModule({
  exports: [ProposalCardModule, ProposalStatusModule],
  imports: [CommonModule],
})
export class ProposalModule {}
