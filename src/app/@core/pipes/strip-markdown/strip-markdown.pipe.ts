import { Pipe, PipeTransform } from '@angular/core';
import { remark } from 'remark';
import strip from 'strip-markdown';

@Pipe({
  name: 'stripMarkdown',
})
export class StripMarkDownPipe implements PipeTransform {
  public transform(str: string | undefined): string {
    if (!str) {
      return '';
    }

    return String(remark().use(strip).processSync(str));
  }
}
