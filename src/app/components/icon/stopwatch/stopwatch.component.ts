import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-icon-stopwatch',
  templateUrl: './stopwatch.component.html',
  styleUrls: ['./stopwatch.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StopwatchIconComponent {}
