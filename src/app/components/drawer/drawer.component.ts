import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-drawer',
  templateUrl: './drawer.component.html',
  styleUrls: ['./drawer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerComponent {
  @Input() isVisible: boolean | null = false;
  @Input() bodyClasses = '';
}
