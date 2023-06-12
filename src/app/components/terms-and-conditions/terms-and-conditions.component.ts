import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DeviceService } from '@core/services/device';

@Component({
  selector: 'wen-terms-and-conditions',
  templateUrl: './terms-and-conditions.component.html',
  styleUrls: ['./terms-and-conditions.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsAndConditionsComponent {
  @Input() isChecked = false;
  @Input() label? = $localize`By checking this box, you agree with`;
  @Input() linkLabel? = $localize`Terms and Conditions`;
  @Input() showLink = true;
  @Input() documentLink!: string;
  @Input() disabled = false;
  @Output() wenOnCheckChange = new EventEmitter<boolean>();

  constructor(public deviceService: DeviceService) {}

  public onChange(value: boolean): void {
    this.isChecked = value;
    this.wenOnCheckChange.emit(this.isChecked);
  }
}
