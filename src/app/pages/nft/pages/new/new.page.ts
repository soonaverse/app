import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { ROUTER_UTILS } from '@core/utils/router.utils';

export enum StepType {
  GENERATE = 'Generate',
  PUBLISH = 'Publish',
}

@Component({
  selector: 'wen-new',
  templateUrl: './new.page.html',
  styleUrls: ['./new.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPage {
  public sections = [
    { route: [ROUTER_UTILS.config.nft.single], label: $localize`Single` },
    { route: [ROUTER_UTILS.config.nft.multiple], label: $localize`Multiple` },
  ];

  constructor(public deviceService: DeviceService) {}
}
