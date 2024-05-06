import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@buildcore/interfaces';
import dayjs from 'dayjs';

@Pipe({
  pure: false,
  name: 'countdownTime',
})
export class CountdownTime implements PipeTransform {
  transform(date: dayjs.Dayjs | Timestamp | null): string {
    if (!date) {
      return '';
    }

    const midnight: dayjs.Dayjs = dayjs(new Date().setHours(0, 0, 0, 0));
    const difInSec: number = dayjs(date.toDate()).diff(dayjs(), 'second');
    return difInSec > 0 ? midnight.add(difInSec, 'second').format('mm:ss') : 'expired';
  }
}
