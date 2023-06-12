import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-alert-octagon',
  templateUrl: './alert-octagon.component.html',
  styleUrls: ['./alert-octagon.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertOctagonIconComponent {
  @Input() size = 24;
}
