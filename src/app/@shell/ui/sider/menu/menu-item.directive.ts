import { Directive, Input, ViewContainerRef } from '@angular/core';
import { MenuItem } from './menu-item';

@Directive({
  selector: '[wenMenuItem]',
})
export class MenuItemDirective {
  @Input() wenMenuItem: MenuItem | null = null;

  constructor(public viewContainerRef: ViewContainerRef) {}
}
