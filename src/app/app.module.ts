import { HttpClientModule } from '@angular/common/http';
// import de from '@angular/common/locales/de';
// import en from '@angular/common/locales/en';
// import es from '@angular/common/locales/es';
// import fr from '@angular/common/locales/fr';
// import it from '@angular/common/locales/it';
// import ko from '@angular/common/locales/ko';
// import nl from '@angular/common/locales/nl';
// import zh from '@angular/common/locales/zh';
import { LOCALE_ID, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { IconDefinition } from '@ant-design/icons-angular';
import { Languages } from '@core/utils/language.util';
import { WebShellModule } from '@shell/ft/web-shell.module';
/* eslint-disable */
import { NZ_I18N } from 'ng-zorro-antd/i18n';
/* eslint-enable */
import { NzIconModule } from 'ng-zorro-antd/icon';
import { CoreModule } from './@core/core.module';
import { WenComponent } from './app.component';
// Register languages.
// registerLocaleData(en);
// registerLocaleData(de);
// registerLocaleData(nl);
// registerLocaleData(fr);
// registerLocaleData(ko);
// registerLocaleData(es);
// registerLocaleData(it);
// registerLocaleData(zh);

const icons: IconDefinition[] = [];
export const imports: any[] = [
  CoreModule,
  WebShellModule,
  HttpClientModule,
  BrowserAnimationsModule,
  NzIconModule.forRoot(icons),
];

@NgModule({
  declarations: [WenComponent],
  imports: [BrowserModule.withServerTransition({ appId: 'serverApp' }), ...imports],
  bootstrap: [WenComponent],
  providers: [
    {
      /* eslint-disable */
      provide: NZ_I18N,
      useFactory: (localId: string) => {
        /** keep the same with angular.json/i18n/locales configuration **/
        return Languages[localId]?.ngZorro || Languages.en.ngZorro;
        /* eslint-enable */
      },
      deps: [LOCALE_ID],
    },
  ],
})
export class AppModule {}
