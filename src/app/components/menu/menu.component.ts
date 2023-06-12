import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent {}
