import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconModule } from '@components/icon/icon.module';
import { NzAvatarModule } from 'ng-zorro-antd/avatar';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { SelectCollectionComponent } from './select-collection.component';

@NgModule({
  declarations: [SelectCollectionComponent],
  imports: [
    CommonModule,
    IconModule,
    NzDrawerModule,
    NzModalModule,
    NzAvatarModule,
    NzInputModule,
    NzSelectModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
  ],
  exports: [SelectCollectionComponent],
})
export class SelectCollectionModule {}
