import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-check',
  templateUrl: './check.component.html',
  styleUrls: ['./check.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckIconComponent {
  @Input() size = 16;
}
