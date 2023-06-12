import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { CollectionStatusComponent } from './collection-status.component';

@NgModule({
  exports: [CollectionStatusComponent],
  declarations: [CollectionStatusComponent],
  imports: [CommonModule, NzTagModule],
})
export class CollectionStatusModule {}
