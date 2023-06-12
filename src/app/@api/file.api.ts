import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import {
  FILE_SIZES,
  SOON_PROD_ADDRESS_API,
  SOON_TEST_ADDRESS_API,
  WEN_FUNC,
} from '@build-5/interfaces';
import { NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { Observable, map, of } from 'rxjs';

const EXTENSION_PAT = /\.[^/.]+$/;

@Injectable({
  providedIn: 'root',
})
export class FileApi {
  constructor(protected httpClient: HttpClient) {}

  public static getUrl(org: string, size?: FILE_SIZES): string {
    const ext = org.match(EXTENSION_PAT)?.[0]?.replace('.', '_');
    if (!size || !ext) {
      return org;
    }
    return org.replace(EXTENSION_PAT, ext + '_' + size + '.webp');
  }

  public static getVideoPreview(org: string): string | undefined {
    const extensionPat = EXTENSION_PAT;
    const ext = org.match(extensionPat)?.[0]?.replace('.', '_');
    if (!ext) {
      return undefined;
    }
    return org.replace(EXTENSION_PAT, ext + '_preview.webp');
  }

  public getMetadata = (url?: string): Observable<'video' | 'image'> => {
    if (!url) {
      return of('image');
    }
    return of(url.match('.mp4$') ? 'video' : 'image');
  };

  public upload(memberId: string, item: NzUploadXHRArgs) {
    const formData = new FormData();
    formData.append('file', <Blob>item.postFile);
    formData.append('member', memberId);
    formData.append('uid', item.file.uid);
    const origin = environment.production ? SOON_PROD_ADDRESS_API : SOON_TEST_ADDRESS_API;
    return this.httpClient
      .post(origin + WEN_FUNC.uploadFile, formData)
      .pipe(
        map((b: any) => {
          if (item.onSuccess) {
            item.onSuccess(b.url, item.file, b.url);
          }
        }),
      )
      .subscribe();
  }
}
