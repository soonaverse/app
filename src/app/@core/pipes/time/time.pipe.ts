import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@build-5/interfaces';
import dayjs from 'dayjs';

@Pipe({
  pure: false,
  name: 'Time',
})
export class Time implements PipeTransform {
  transform(date: dayjs.Dayjs | Timestamp | null): string {
    if (!date || !date.toDate) {
      return '--:--:--';
    }

    return dayjs(date.toDate()).format('HH:mm:ss');
  }
}
