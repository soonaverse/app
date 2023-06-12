import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-default-space',
  templateUrl: './default-space.component.html',
  styleUrls: ['./default-space.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DefaultSpaceIconComponent {
  @Input() size = 24;
}
