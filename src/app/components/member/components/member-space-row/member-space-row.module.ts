import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IconModule } from '@components/icon/icon.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { MemberSpaceRowComponent } from './member-space-row.component';

@NgModule({
  declarations: [MemberSpaceRowComponent],
  imports: [CommonModule, IconModule, NzTagModule, NzAvatarModule, NzIconModule, RouterModule],
  exports: [MemberSpaceRowComponent],
})
export class MemberSpaceRowModule {}
