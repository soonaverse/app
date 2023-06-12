import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-guardians-only',
  templateUrl: './guardians-only.component.html',
  styleUrls: ['./guardians-only.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuardiansOnlyIconComponent {
  @Input() size = 24;
}
