import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { ThemeList, ThemeService } from '@core/services/theme';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'wen-theme-switch',
  templateUrl: './theme-switch.component.html',
  styleUrls: ['./theme-switch.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeSwitchComponent {
  theme = ThemeList;

  constructor(public deviceService: DeviceService, private themeService: ThemeService) {}

  public get currentTheme$(): BehaviorSubject<ThemeList | undefined> {
    return this.themeService.theme$;
  }

  onClickChangeTheme(theme: ThemeList): void {
    // Switching not enabled yet
    this.themeService.setTheme(theme);
  }
}
