import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ROUTER_UTILS } from '@core/utils/router.utils';

@Component({
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  path = ROUTER_UTILS.config.base;

  public get discoverRoute() {
    return ['/', ROUTER_UTILS.config.discover.root];
  }
}
