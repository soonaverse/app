import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { copyToClipboard } from '@core/utils/tools.utils';

export enum ShareComponentSize {
  SMALL = 'small',
  DEFAULT = 'default',
  LARGE = 'large',
}

@Component({
  selector: 'wen-share',
  templateUrl: './share.component.html',
  styleUrls: ['./share.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareComponent {
  @Input() shareText = '';
  @Input() shareUrl = '';
  @Input() size: ShareComponentSize = ShareComponentSize.DEFAULT;
  public isCopied = false;

  constructor(public deviceService: DeviceService, private cd: ChangeDetectorRef) {}

  public get shareSizes(): typeof ShareComponentSize {
    return ShareComponentSize;
  }

  public getShareUrl(): string {
    return (
      'https://twitter.com/share?text=' +
      this.shareText +
      '&url=' +
      this.shareUrl +
      '&hashtags=soonaverse'
    );
  }

  public copy(): void {
    if (!this.isCopied) {
      copyToClipboard(window?.location.href);
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
        this.cd.markForCheck();
      }, 3000);
    }
  }
}
