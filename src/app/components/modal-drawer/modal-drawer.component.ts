import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  TemplateRef,
} from '@angular/core';
import { DeviceService } from '@core/services/device';
import { MODAL_WIDTH } from '@core/utils/modal.util';

@Component({
  selector: 'wen-modal-drawer',
  templateUrl: './modal-drawer.component.html',
  styleUrls: ['./modal-drawer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalDrawerComponent {
  @Input() title = '';
  @Input() content?: TemplateRef<unknown>;

  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  public get isOpen(): boolean {
    return this._isOpen;
  }

  @Input() modalWidth = MODAL_WIDTH;
  @Input() primaryColor = true;
  @Input() showHeader = true;
  @Input() hasPadding = true;
  @Output() wenOnClose = new EventEmitter<void>();

  private _isOpen = false;

  constructor(public deviceService: DeviceService) {}

  public close(): void {
    this.isOpen = false;
    this.wenOnClose.next();
  }
}
