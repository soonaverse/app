import { Pipe, PipeTransform } from '@angular/core';
import reHypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkReHype from 'remark-rehype';
import { unified } from 'unified';

@Pipe({
  name: 'markdown',
})
export class MarkDownPipe implements PipeTransform {
  public transform(str: string | undefined): string {
    if (!str) {
      return '';
    }

    const output = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkReHype)
      .use(reHypeStringify)
      .processSync(str);

    return String(output);
  }
}
