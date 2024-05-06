import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '@env/environment';
import { FILE_SIZES } from '@buildcore/interfaces';
import { NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { Observable, map, of } from 'rxjs';
import { Buildcore, https } from '@buildcore/sdk';

const EXTENSION_PAT = /\.[^/.]+$/;
const ORIGIN = environment.production ? Buildcore.PROD : Buildcore.TEST;

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

  public upload = (memberId: string, item: NzUploadXHRArgs) =>
    https(ORIGIN)
      .project(environment.buildcoreToken)
      .uploadFile(<Blob>item.postFile, memberId, item.file.uid)
      .pipe(
        map((r) => {
          if (item.onSuccess) {
            item.onSuccess(r.url, item.file, r.url);
          }
        }),
      )
      .subscribe();
}
