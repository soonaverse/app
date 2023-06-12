import { NgModule } from '@angular/core';
import { ServerModule } from '@angular/platform-server';
import { WenComponent } from './app.component';
import { AppModule } from './app.module';

@NgModule({
  imports: [AppModule, ServerModule],
  bootstrap: [WenComponent],
})
export class AppServerModule {}
