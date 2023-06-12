import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SpaceCardModule } from './components/space-card/space-card.module';

@NgModule({
  exports: [SpaceCardModule],
  imports: [CommonModule],
})
export class SpaceModule {}
