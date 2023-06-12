import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unknownIfZero',
})
export class UnknownIfZeroPipe implements PipeTransform {
  transform(value?: string | null): any {
    if (!(parseFloat(value || '') < 0 || parseFloat(value || '') > 0)) {
      return '-';
    } else {
      return value;
    }
  }
}
