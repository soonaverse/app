import { Injectable } from '@angular/core';
import { FileApi } from '@api/file.api';
import { FILE_SIZES } from '@soonaverse/interfaces';

@Injectable({
  providedIn: 'root',
})
export class PreviewImageService {
  public getUrl(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    return FileApi.getUrl(url);
  }

  public getVideoPreview(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    return FileApi.getVideoPreview(url);
  }

  public getTokenSize(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    return FileApi.getUrl(url, FILE_SIZES.small);
  }

  public getAvatarSize(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    return FileApi.getUrl(url, FILE_SIZES.small);
  }

  public getNftSize(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    return FileApi.getUrl(url, FILE_SIZES.medium);
  }

  public getCollectionSize(url?: string | null): string | undefined {
    if (!url) {
      return undefined;
    }

    return FileApi.getUrl(url, FILE_SIZES.medium);
  }
}
