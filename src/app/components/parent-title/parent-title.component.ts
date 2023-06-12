import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-parent-title',
  templateUrl: './parent-title.component.html',
  styleUrls: ['./parent-title.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParentTitleComponent {
  @Input() public image?: string;
  @Input() public text?: string;
}
