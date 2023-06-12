import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TabSection } from '@components/tabs/tabs.component';

@Component({
  selector: 'wen-dropdown-tabs',
  templateUrl: './dropdown-tabs.component.html',
  styleUrls: ['./dropdown-tabs.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DropdownTabsComponent {
  @Input() tabs: TabSection[] = [];
  @Input() selectedTab?: TabSection;
  public isVisible = false;

  public trackByLabel(index: number, tab: TabSection): string {
    return tab.label;
  }
}
