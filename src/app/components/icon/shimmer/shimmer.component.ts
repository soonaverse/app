import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-shimmer',
  templateUrl: './shimmer.component.html',
  styleUrls: ['./shimmer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShimmerIconComponent {
  @Input() size = 24;
}
