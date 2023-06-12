import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-sun',
  templateUrl: './sun.component.html',
  styleUrls: ['./sun.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SunIconComponent {
  @Input() stroke = 'currentColor';
}
