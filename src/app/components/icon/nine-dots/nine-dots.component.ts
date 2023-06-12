import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-nine-dots',
  templateUrl: './nine-dots.component.html',
  styleUrls: ['./nine-dots.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NineDotsIconComponent {
  @Input() size = 24;
}
