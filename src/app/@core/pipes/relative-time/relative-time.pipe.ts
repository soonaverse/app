import { Pipe, PipeTransform } from '@angular/core';
import { Timestamp } from '@build-5/interfaces';
import dayjs from 'dayjs';
import * as relativeTime from 'dayjs/plugin/relativeTime';
import * as updateLocale from 'dayjs/plugin/updateLocale';

dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.updateLocale('en', {
  relativeTime: {
    future: 'in %s',
    past: '%s ago',
    s: 'in %d seconds',
    m: 'a minute',
    mm: '%d minutes',
    h: 'an hour',
    hh: '%d hours',
    d: 'a day',
    dd: '%d days',
    M: 'a month',
    MM: '%d months',
    y: 'a year',
    yy: '%d years',
  },
});

@Pipe({
  pure: false,
  name: 'relativeTime',
})
export class RelativeTime implements PipeTransform {
  transform(date: dayjs.Dayjs | Timestamp | null, type: 'from' | 'to' = 'from'): string {
    if (!date) {
      return '';
    }

    return type === 'from' ? dayjs(date.toDate()).fromNow() : dayjs(date.toDate()).toNow();
  }
}
