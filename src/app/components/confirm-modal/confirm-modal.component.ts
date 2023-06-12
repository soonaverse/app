import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

export enum ConfirmModalType {
  WARNING = 'Warning',
}

@Component({
  selector: 'wen-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmModalComponent {
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() type?: ConfirmModalType;
  @Input() title = $localize`Are you sure?`;
  @Input() description?: string;
  @Input() warning?: string;
  @Input() declineLabel = $localize`Close`;
  @Input() confirmLabel = $localize`Confirm`;
  @Output() wenOnClose = new EventEmitter<boolean>();

  private _isOpen = false;

  constructor(private cd: ChangeDetectorRef) {}

  public reset(): void {
    this.isOpen = false;
    this.cd.markForCheck();
  }

  public close(value: boolean): void {
    this.reset();
    this.wenOnClose.next(value);
  }

  public get confirmModalTypes(): typeof ConfirmModalType {
    return ConfirmModalType;
  }
}
