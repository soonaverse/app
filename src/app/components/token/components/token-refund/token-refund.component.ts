import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { PreviewImageService } from '@core/services/preview-image';
import { Token, TokenDistribution, getDefDecimalIfNotSet } from '@soonaverse/interfaces';

@Component({
  selector: 'wen-token-refund',
  templateUrl: './token-refund.component.html',
  styleUrls: ['./token-refund.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenRefundComponent {
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() token?: Token | null;
  @Input() memberDistribution?: TokenDistribution | null;
  @Output() wenOnClose = new EventEmitter<void>();

  public amountControl: FormControl = new FormControl(null);
  public agreeTermsConditions = false;
  public agreeTokenTermsConditions = false;
  private _isOpen = false;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private notification: NotificationService,
  ) {}

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public reset(): void {
    this.isOpen = false;
    this.cd.markForCheck();
  }

  public getTitle(): string {
    return $localize`Refund token`;
  }

  public formatTokenBest(amount?: number | null): string {
    if (!amount) {
      return '0';
    }

    return amount.toFixed(2);
  }

  public async confirm(): Promise<void> {
    const data = {
      token: this.token?.uid,
      amount:
        Number(this.amountControl.value) *
        Math.pow(10, getDefDecimalIfNotSet(this.token?.decimals)),
    };
    await this.auth.sign(data, (sc, finish) => {
      this.notification
        .processRequest(this.tokenApi.creditToken(sc), 'Token successfully refunded.', finish)
        .subscribe(() => this.close());
    });
  }
}
