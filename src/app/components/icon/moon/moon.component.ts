import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-moon',
  templateUrl: './moon.component.html',
  styleUrls: ['./moon.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MoonIconComponent {
  @Input() stroke = 'currentColor';
}
