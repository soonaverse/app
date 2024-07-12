import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { TabSection } from '@components/tabs/tabs.component';
import { DeviceService } from '@core/services/device';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy } from '@ngneat/until-destroy';
import { FilterService } from './../../services/filter.service';

export const discoverSections: TabSection[] = [
  { route: [`../${ROUTER_UTILS.config.discover.spaces}`], label: $localize`Spaces` },
  { route: [`../${ROUTER_UTILS.config.discover.awards}`], label: $localize`Awards` },
  { route: [`../${ROUTER_UTILS.config.discover.proposals}`], label: $localize`Proposals` },
  { route: [`../${ROUTER_UTILS.config.discover.members}`], label: $localize`Members` },
];

@UntilDestroy()
@Component({
  selector: 'wen-discover',
  // changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,

  templateUrl: './discover.page.html',
  styleUrls: ['./discover.page.less'],
})
export class DiscoverPage implements OnDestroy, OnInit {
  constructor(public filter: FilterService, public deviceService: DeviceService) {
  }

  public ngOnInit(): void {
    window.location.href = 'https://soonaverse.com/home/';
    this.deviceService.viewWithSearch$.next(true);
  }

  public ngOnDestroy(): void {
    this.filter.resetSubjects();
  }
}
