import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { UsdBelowTwoDecimals } from './usd-below-two-decimals.pipe';

@NgModule({
  declarations: [UsdBelowTwoDecimals],
  imports: [CommonModule],
  exports: [UsdBelowTwoDecimals],
})
export class UsdBelowTwoDecimalsModule {}
