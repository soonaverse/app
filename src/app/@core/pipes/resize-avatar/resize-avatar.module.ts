import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ResizeAvatarPipe } from './resize-avatar.pipe';

@NgModule({
  declarations: [ResizeAvatarPipe],
  imports: [CommonModule],
  exports: [ResizeAvatarPipe],
})
export class ResizeAvatarModule {}
