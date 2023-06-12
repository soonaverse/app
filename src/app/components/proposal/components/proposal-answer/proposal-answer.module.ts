import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RadioModule } from '@components/radio/radio.module';
import { MarkDownModule } from '@core/pipes/markdown/markdown.module';
import { ProposalAnswerComponent } from './proposal-answer.component';

@NgModule({
  declarations: [ProposalAnswerComponent],
  imports: [CommonModule, MarkDownModule, RadioModule],
  exports: [ProposalAnswerComponent],
})
export class ProposalAnswerModule {}
