import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-verified',
  templateUrl: './verified.component.html',
  styleUrls: ['./verified.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifiedIconComponent {
  @Input() size = 24;
}
