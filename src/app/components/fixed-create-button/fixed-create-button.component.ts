import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-fixed-create-button',
  templateUrl: './fixed-create-button.component.html',
  styleUrls: ['./fixed-create-button.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FixedCreateButtonComponent {
  @Input() route: string | string[] = '';
}
