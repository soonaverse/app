import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-menu-item',
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemComponent {}
