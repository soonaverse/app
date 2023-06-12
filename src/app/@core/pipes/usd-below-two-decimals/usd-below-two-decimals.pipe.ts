import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  pure: false,
  name: 'UsdBelowTwoDecimals',
})
export class UsdBelowTwoDecimals implements PipeTransform {
  transform(number: string | null): string {
    return (number === '$0.00' ? '<' : '') + number;
  }
}
