import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-drawer-toggle',
  templateUrl: './drawer-toggle.component.html',
  styleUrls: ['./drawer-toggle.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerToggleComponent {
  @Input() label = '';
}
