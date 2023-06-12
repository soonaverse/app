import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-icon-trash',
  templateUrl: './trash.component.html',
  styleUrls: ['./trash.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrashIconComponent {}
