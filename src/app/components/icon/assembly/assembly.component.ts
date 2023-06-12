import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-assembly',
  templateUrl: './assembly.component.html',
  styleUrls: ['./assembly.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssemblyIconComponent {
  @Input() size = 24;
}
