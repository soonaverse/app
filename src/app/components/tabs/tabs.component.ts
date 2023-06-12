import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  QueryList,
  Type,
  ViewChildren,
  ViewContainerRef,
} from '@angular/core';

export interface TabSection {
  label: string;
  route: string | string[];
  icon?: any;
}

@Component({
  selector: 'wen-tabs',
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements AfterViewInit {
  @Input() tabs: TabSection[] = [];

  @ViewChildren('tabIcon', { read: ViewContainerRef })
  tabIconElements!: QueryList<ViewContainerRef>;

  public ngAfterViewInit(): void {
    this.tabIconElements.toArray().forEach((tab, index: number) => {
      if (this.tabs[index].icon) {
        tab.createComponent(this.tabs[index].icon as Type<unknown>);
      }
    });
  }
}
