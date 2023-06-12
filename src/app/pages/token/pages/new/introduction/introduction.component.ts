import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { StepType } from '../new.page';

@Component({
  selector: 'wen-new-introduction',
  templateUrl: './introduction.component.html',
  styleUrls: ['./introduction.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewIntroductionComponent {
  @Output() wenOnTabChange = new EventEmitter<StepType>();

  constructor(public deviceService: DeviceService) {}

  public get stepTypes(): typeof StepType {
    return StepType;
  }

  public onFillForm(): void {
    window?.open(
      'https://docs.google.com/forms/d/1eVncgmw8SaNm_5VzxP8FTYQ9s_pHBXyQQ4pTM1ScT0I',
      '_blank',
    );
  }
}
