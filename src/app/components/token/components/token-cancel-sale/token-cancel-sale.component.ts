import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { Token } from '@soonaverse/interfaces';

@Component({
  selector: 'wen-token-cancel-sale',
  templateUrl: './token-cancel-sale.component.html',
  styleUrls: ['./token-cancel-sale.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenCancelSaleComponent {
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() token?: Token;
  @Output() wenOnClose = new EventEmitter<void>();

  private _isOpen = false;

  constructor(
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private notification: NotificationService,
    private tokenApi: TokenApi,
  ) {}

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public reset(): void {
    this.isOpen = false;
    this.cd.markForCheck();
  }

  public async cancelSale(): Promise<void> {
    await this.auth.sign({ token: this.token?.uid }, (sc, finish) => {
      this.notification
        .processRequest(
          this.tokenApi.cancelPublicSale(sc),
          $localize`Canceled public sale.`,
          finish,
        )
        .subscribe(() => this.close());
    });
  }
}
