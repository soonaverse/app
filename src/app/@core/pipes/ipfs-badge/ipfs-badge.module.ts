import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { IpfsBadgePipe } from './ipfs-badge.pipe';

@NgModule({
  declarations: [IpfsBadgePipe],
  imports: [CommonModule],
  exports: [IpfsBadgePipe],
})
export class IpfsBadgeModule {}
