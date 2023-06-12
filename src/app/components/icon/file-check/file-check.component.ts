import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-file-check',
  templateUrl: './file-check.component.html',
  styleUrls: ['./file-check.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileCheckIconComponent {
  @Input() size = 24;
}
