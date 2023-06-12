import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-file-export',
  templateUrl: './file-export.component.html',
  styleUrls: ['./file-export.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileExportIconComponent {
  @Input() size = 24;
}
