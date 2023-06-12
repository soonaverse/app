import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-link',
  templateUrl: './link.component.html',
  styleUrls: ['./link.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkIconComponent {
  @Input() size = 24;
}
