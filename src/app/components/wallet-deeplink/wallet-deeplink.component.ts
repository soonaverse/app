import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { DEFAULT_NETWORK, NETWORK_DETAIL, Network, WEN_NAME } from '@build-5/interfaces';

@Component({
  selector: 'wen-wallet-deeplink',
  templateUrl: './wallet-deeplink.component.html',
  styleUrls: ['./wallet-deeplink.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WalletDeeplinkComponent {
  @Input()
  set network(value: Network | undefined | null) {
    this._network = value || undefined;
    this.setLinks();
  }

  get network(): Network | undefined {
    return this._network;
  }

  @Input()
  set targetAddress(value: string | undefined) {
    this._targetAddress = value;
    this.setLinks();
  }

  get targetAddress(): string | undefined {
    return this._targetAddress;
  }

  @Input()
  set targetAmount(value: string | undefined) {
    this._targetAmount = value;
    this.setLinks();
  }

  get targetAmount(): string | undefined {
    return this._targetAmount;
  }

  @Input()
  set tokenId(value: string | undefined) {
    this._tokenId = value;
    this.setLinks();
  }

  get tokenId(): string | undefined {
    return this._tokenId;
  }

  @Input()
  set surplus(value: boolean) {
    this._surplus = value || false;
    this.setLinks();
  }

  get surplus(): boolean {
    return this._surplus;
  }

  @Input()
  set tokenAmount(value: number | undefined) {
    this._tokenAmount = value;
    this.setLinks();
  }

  get tokenAmount(): number | undefined {
    return this._tokenAmount;
  }

  @Input() public showTanglePay = true;

  public fireflyDeepLink?: SafeUrl;
  public tanglePayDeepLink?: SafeUrl;
  private _targetAddress?: string;
  private _network?: Network;
  private _targetAmount?: string;
  private _surplus = false;
  private _tokenId?: string;
  private _tokenAmount?: number;

  constructor(private sanitizer: DomSanitizer, private cd: ChangeDetectorRef) {}

  private setLinks(): void {
    this.fireflyDeepLink = this.getFireflyDeepLink();
    this.tanglePayDeepLink = this.getTanglePayDeepLink();
  }

  private getFireflyDeepLink(): SafeUrl {
    if (!this.targetAddress || !this.targetAmount) {
      return '';
    }

    // We want to round to maximum 6 digits.
    if (this.network === Network.RMS || this.network === Network.SMR) {
      const walletType = this.network === Network.SMR ? 'firefly' : 'firefly-alpha';
      if (this.tokenId && this.tokenAmount) {
        return this.sanitizer.bypassSecurityTrustUrl(
          walletType +
            '://wallet/sendConfirmation?address=' +
            this.targetAddress +
            '&assetId=' +
            this.tokenId +
            '&disableToggleGift=true&disableChangeExpiration=true' +
            '&amount=' +
            Number(this.tokenAmount).toFixed(0) +
            '&tag=soonaverse&giftStorageDeposit=true' +
            (this.surplus ? '&surplus=' + Number(this.targetAmount).toFixed(0) : ''),
        );
      } else {
        return this.sanitizer.bypassSecurityTrustUrl(
          walletType +
            '://wallet/sendConfirmation?address=' +
            this.targetAddress +
            '&disableToggleGift=true&disableChangeExpiration=true' +
            '&amount=' +
            Number(this.targetAmount).toFixed(0) +
            '&tag=soonaverse&giftStorageDeposit=true',
        );
      }
    } else {
      return this.sanitizer.bypassSecurityTrustUrl(
        'iota://wallet/send/' +
          this.targetAddress +
          '?amount=' +
          +(Number(this.targetAmount) / NETWORK_DETAIL[this.network || DEFAULT_NETWORK].divideBy)
            .toFixed(6)
            .replace(/,/g, '.') +
          '&unit=Mi',
      );
    }
  }

  private getTanglePayDeepLink(): SafeUrl {
    if (!this.targetAddress || !this.targetAmount) {
      return '';
    }

    // We want to round to maximum 6 digits.
    if (this.network === Network.RMS || this.network === Network.SMR) {
      if (this.tokenId && this.tokenAmount) {
        return this.sanitizer.bypassSecurityTrustUrl(
          'tanglepay://iota_sendTransaction/' +
            this.targetAddress +
            '?value=' +
            Number(this.tokenAmount).toFixed(0) +
            '&network=shimmer&assetId=' +
            this.tokenId +
            '&tag=' +
            WEN_NAME.toLowerCase(),
        );
      } else {
        return this.sanitizer.bypassSecurityTrustUrl(
          'tanglepay://send/' +
            this.targetAddress +
            '?value=' +
            +(Number(this.targetAmount) / NETWORK_DETAIL[this.network].divideBy)
              .toFixed(6)
              .replace(/,/g, '.') +
            '&unit=SMR' +
            '&tag=' +
            WEN_NAME.toLowerCase(),
        );
      }
    } else {
      return this.sanitizer.bypassSecurityTrustUrl(
        'tanglepay://send/' +
          this.targetAddress +
          '?value=' +
          +(Number(this.targetAmount) / NETWORK_DETAIL[this.network || DEFAULT_NETWORK].divideBy)
            .toFixed(6)
            .replace(/,/g, '.') +
          '&unit=Mi' +
          '&tag=' +
          WEN_NAME.toLowerCase(),
      );
    }
  }
}
