import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IconModule } from '@components/icon/icon.module';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { FooterModule } from '../footer/footer.module';
import { HeaderModule } from '../header/header.module';
import { SiderModule } from '../sider/sider.module';
import { ContentComponent } from './content/content.component';
import { LayoutComponent } from './layout.component';

@NgModule({
  declarations: [LayoutComponent, ContentComponent],
  imports: [
    CommonModule,
    HeaderModule,
    FooterModule,
    NzLayoutModule,
    SiderModule,
    IconModule,
    NzButtonModule,
  ],
  exports: [LayoutComponent, ContentComponent],
})
export class LayoutModule {}
