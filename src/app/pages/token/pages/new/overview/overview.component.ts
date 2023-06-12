import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { NewService } from '@pages/token/services/new.service';
import { StepType } from '../new.page';

@Component({
  selector: 'wen-new-overview',
  templateUrl: './overview.component.html',
  styleUrls: ['./overview.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewOverviewComponent {
  @Output() wenOnTabChange = new EventEmitter<StepType>();

  constructor(public newService: NewService, public deviceService: DeviceService) {}

  public get stepTypes(): typeof StepType {
    return StepType;
  }
}
