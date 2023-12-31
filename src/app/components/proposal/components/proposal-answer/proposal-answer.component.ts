import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProposalAnswer } from '@build-5/interfaces';

@Component({
  selector: 'wen-proposal-answer',
  templateUrl: './proposal-answer.component.html',
  styleUrls: ['./proposal-answer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalAnswerComponent {
  @Input() answer?: ProposalAnswer;
}
