import { Pipe, PipeTransform } from '@angular/core';
import { FILE_SIZES } from '@soonaverse/interfaces';

@Pipe({
  name: 'resizeAvatar',
})
export class ResizeAvatarPipe implements PipeTransform {
  transform(url?: string, size: FILE_SIZES.small | FILE_SIZES.large = FILE_SIZES.small): string {
    if (!url) {
      return '/assets/mocks/no_avatar.png';
    }

    return url;
  }
}
