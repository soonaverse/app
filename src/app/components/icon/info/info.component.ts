import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-info',
  templateUrl: './info.component.html',
  styleUrls: ['./info.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoIconComponent {
  @Input() size = 24;
}
