import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-radio',
  templateUrl: './radio.component.html',
  styleUrls: ['./radio.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RadioComponent {
  @Input() value: string | boolean | number = '';

  @Input() disabled = false;
}
