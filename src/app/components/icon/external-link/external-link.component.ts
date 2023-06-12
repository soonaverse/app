import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-external-link',
  templateUrl: './external-link.component.html',
  styleUrls: ['./external-link.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalLinkIconComponent {
  @Input() size = 24;
}
