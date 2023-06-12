import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ROUTER_UTILS } from '@core/utils/router.utils';

@Component({
  selector: 'wen-not-found',
  templateUrl: './not-found.page.html',
  styleUrls: ['./not-found.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {
  public get marketplaceRoute() {
    return ['/', ROUTER_UTILS.config.market.root];
  }
}
