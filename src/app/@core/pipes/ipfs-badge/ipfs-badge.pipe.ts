import { Pipe, PipeTransform } from '@angular/core';
import { FileMetedata, FILE_SIZES, IPFS_GATEWAY_AVATAR } from '@soonaverse/interfaces';

@Pipe({
  name: 'ipfsBadge',
})
export class IpfsBadgePipe implements PipeTransform {
  transform(
    metadata?: FileMetedata,
    size: FILE_SIZES.small | FILE_SIZES.large = FILE_SIZES.small,
  ): string {
    if (!metadata?.avatar || !metadata?.fileName) {
      return '/assets/mocks/trophy.png';
    }

    // This IPFS
    return (
      IPFS_GATEWAY_AVATAR +
      (size === FILE_SIZES.small ? metadata.avatar : metadata.original) +
      '/' +
      metadata.fileName +
      '.png'
    );
  }
}
