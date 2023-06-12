import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MemberCardModule } from './components/member-card/member-card.module';
import { MemberEditDrawerModule } from './components/member-edit-drawer/member-edit-drawer.module';

@NgModule({
  exports: [MemberCardModule, MemberEditDrawerModule],
  imports: [CommonModule],
})
export class MemberModule {}
