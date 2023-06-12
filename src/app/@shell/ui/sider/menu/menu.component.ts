import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ComponentFactoryResolver,
  Input,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { MenuItemDirective } from './menu-item.directive';

@Component({
  selector: 'wen-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements AfterViewChecked {
  @Input() set items(value: MenuItem[]) {
    this.menuItems = value;
    this.reCreateIcons = true;
  }

  public menuItems: MenuItem[] = [];
  @ViewChildren(MenuItemDirective) menuItemLabels!: QueryList<MenuItemDirective>;
  private reCreateIcons = false;

  constructor(
    public deviceService: DeviceService,
    private router: Router,
    private componentFactoryResolver: ComponentFactoryResolver,
  ) {}

  loadIconComponents() {
    if (this.menuItemLabels) {
      for (const itemLabel of this.menuItemLabels.toArray()) {
        const iconComponent = this.componentFactoryResolver.resolveComponentFactory(
          itemLabel.wenMenuItem?.icon,
        );
        itemLabel.viewContainerRef.clear();
        itemLabel.viewContainerRef.createComponent(iconComponent);
      }
    }
  }

  public ngAfterViewChecked(): void {
    if (this.reCreateIcons) {
      this.loadIconComponents();
      this.reCreateIcons = false;
    }
  }

  public isSelectedRoute(route: any[]): boolean {
    if (
      this.router.isActive(this.router.createUrlTree(route), {
        paths: 'subset',
        queryParams: 'subset',
        fragment: 'ignored',
        matrixParams: 'ignored',
      })
    ) {
      return true;
    }

    // Default to first.
    // TODO Defaulting of discovery when none of the above.
    if (this.menuItems[0].route === route) {
      // return true;
    }

    return false;
  }

  public trackByTitle(index: number, item: MenuItem): string {
    return item.title;
  }
}
