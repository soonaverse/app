import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-icon-tag',
  templateUrl: './tag.component.html',
  styleUrls: ['./tag.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TagIconComponent {}
