import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'wen-sider',
  templateUrl: './sider.component.html',
  styleUrls: ['./sider.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SiderComponent {
  public homeRoute = ROUTER_UTILS.config.base.home;

  constructor(public auth: AuthService, public deviceService: DeviceService) {}
}
