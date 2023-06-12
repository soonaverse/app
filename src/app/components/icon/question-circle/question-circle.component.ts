import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-question-circle',
  templateUrl: './question-circle.component.html',
  styleUrls: ['./question-circle.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionCircleIconComponent {
  @Input() size = 24;
}
