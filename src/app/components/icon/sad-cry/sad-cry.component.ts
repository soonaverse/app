import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-sad-cry',
  templateUrl: './sad-cry.component.html',
  styleUrls: ['./sad-cry.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SadCryIconComponent {
  @Input() size = 24;
}
