import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-icon-plus',
  templateUrl: './plus.component.html',
  styleUrls: ['./plus.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlusIconComponent {}
