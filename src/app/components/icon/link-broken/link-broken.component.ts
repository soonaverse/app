import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-link-broken',
  templateUrl: './link-broken.component.html',
  styleUrls: ['./link-broken.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LinkBrokenIconComponent {
  @Input() size = 24;
}
