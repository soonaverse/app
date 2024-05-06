import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { getUrlValidator } from '@core/utils/form-validation.utils';
import { MAX_LINKS_COUNT } from '@pages/token/services/new.service';
import {
  DEFAULT_NETWORK,
  MAX_IOTA_AMOUNT,
  NETWORK_DETAIL,
  Token,
  TokenStatus,
} from '@buildcore/interfaces';

@Component({
  selector: 'wen-token-edit',
  templateUrl: './token-edit.component.html',
  styleUrls: ['./token-edit.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenEditComponent {
  @Input() isOpen = false;

  @Input()
  set token(value: Token | undefined) {
    this._token = value;
    this.titleControl.setValue(this.token?.title);
    this.descriptionControl.setValue(this.token?.description);
    this.priceControl.setValue(this.token?.pricePerToken);
    this.shortDescriptionTitleControl.setValue(this.token?.shortDescriptionTitle);
    this.shortDescriptionControl.setValue(this.token?.shortDescription);
    this.token?.links.forEach((link) => this.addLink(link as unknown as string));
  }

  get token(): Token | undefined {
    return this._token;
  }

  @Output() wenOnClose = new EventEmitter<void>();

  public titleControl: FormControl = new FormControl('', Validators.required);
  public descriptionControl: FormControl = new FormControl('', Validators.required);
  public priceControl: FormControl = new FormControl('1', [
    Validators.required,
    Validators.min(0),
    Validators.max(
      MAX_IOTA_AMOUNT /
        NETWORK_DETAIL[this.token?.mintingData?.network || DEFAULT_NETWORK].divideBy,
    ),
  ]);
  public shortDescriptionTitleControl: FormControl = new FormControl('', Validators.required);
  public shortDescriptionControl: FormControl = new FormControl('', Validators.required);
  public links: FormArray;
  public form: FormGroup;
  public maxLinksCount = MAX_LINKS_COUNT;
  private _token?: Token;

  constructor(
    private cd: ChangeDetectorRef,
    private auth: AuthService,
    private tokenApi: TokenApi,
    private notification: NotificationService,
  ) {
    this.links = new FormArray([] as FormGroup[]);

    this.form = new FormGroup({
      title: this.titleControl,
      description: this.descriptionControl,
      pricePerToken: this.priceControl,
      shortDescriptionTitle: this.shortDescriptionTitleControl,
      shortDescription: this.shortDescriptionControl,
      links: this.links,
    });
  }

  public close(): void {
    this.reset();
    this.wenOnClose.next();
  }

  public reset(): void {
    this.isOpen = false;
    this.cd.markForCheck();
  }

  private validateForm(): boolean {
    this.form.updateValueAndValidity();
    if (!this.form.valid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });

      return false;
    }

    return true;
  }

  private getLinkForm(url = ''): FormGroup {
    return new FormGroup({
      url: new FormControl(url, [Validators.required, getUrlValidator()]),
    });
  }

  public addLink(url = ''): void {
    if (this.links.controls.length < MAX_LINKS_COUNT) {
      this.links.push(this.getLinkForm(url));
    }
  }

  public removeLink(index: number): void {
    this.links.removeAt(index);
  }

  public gForm(f: any, value: string): any {
    return f.get(value);
  }

  public async saveChanges(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    const params = {
      ...this.form.value,
      uid: this.token?.uid,
      links: this.links.controls.map((c) => c.value.url),
    };

    if (this.token?.status !== TokenStatus.MINTED) {
      params.name = this.token?.name;
    }

    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.tokenApi.update(sc), 'Updated.', finish)
        .subscribe(() => {
          this.close();
        });
    });
  }
}
