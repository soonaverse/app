import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { ThemeList, ThemeService } from '@core/services/theme';
import { UntilDestroy } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'wen-pool',
  templateUrl: './pool.page.html',
  styleUrls: ['./pool.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PoolPage implements OnInit {
  public theme = ThemeList;

  constructor(public themeService: ThemeService, public deviceService: DeviceService) {}

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(false);
  }

  public onClickChangeTheme(theme: ThemeList): void {
    this.themeService.setTheme(theme);
  }
}
