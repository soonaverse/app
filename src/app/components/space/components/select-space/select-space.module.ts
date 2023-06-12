import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@components/icon/icon.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { SelectSpaceComponent } from './select-space.component';

@NgModule({
  declarations: [SelectSpaceComponent],
  imports: [
    CommonModule,
    NzSelectModule,
    NzFormModule,
    NzAvatarModule,
    IconModule,
    FormsModule,
    ReactiveFormsModule,
    NzDrawerModule,
    NzInputModule,
  ],
  exports: [SelectSpaceComponent],
})
export class SelectSpaceModule {}
