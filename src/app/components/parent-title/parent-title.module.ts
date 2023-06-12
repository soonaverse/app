import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { ParentTitleComponent } from './parent-title.component';

@NgModule({
  declarations: [ParentTitleComponent],
  imports: [CommonModule, NzAvatarModule],
  exports: [ParentTitleComponent],
})
export class ParentTitleModule {}
