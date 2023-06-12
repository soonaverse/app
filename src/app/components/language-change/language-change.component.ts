import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { DeviceService } from '@core/services/device';
import { CookieItem, getCookie, setCookie } from '@core/utils/cookie.utils';
import { Languages } from '@core/utils/language.util';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'wen-language-change',
  templateUrl: './language-change.component.html',
  styleUrls: ['./language-change.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LanguageChangeComponent implements OnInit {
  public languages = Object.values(Languages);
  public languageControl: FormControl = new FormControl();

  constructor(private deviceService: DeviceService) {
    if (this.deviceService.isBrowser) {
      this.languageControl.setValue(
        getCookie(CookieItem.languageOverride) || this.languages[0].remoteHosting,
      );
    }
  }

  ngOnInit(): void {
    let prevLang = this.languageControl.value;
    this.languageControl.valueChanges.pipe(untilDestroyed(this)).subscribe((lang: string) => {
      if (prevLang !== lang) {
        setCookie(CookieItem.languageOverride, lang);
        setTimeout(() => {
          window?.location.reload();
        }, 750);
        prevLang = lang;
      }
    });
  }
}
