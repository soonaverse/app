import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-edit-underline',
  templateUrl: './edit-underline.component.html',
  styleUrls: ['./edit-underline.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditUnderlineIconComponent {
  @Input() size = 24;
}
