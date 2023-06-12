import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { NewService } from '@pages/token/services/new.service';
import { StepType } from '../new.page';

@Component({
  selector: 'wen-new-summary',
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewSummaryComponent {
  @Output() wenOnSubmit = new EventEmitter<void>();
  @Output() wenOnTabChange = new EventEmitter<StepType>();

  constructor(
    public newService: NewService,
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public cache: CacheService,
  ) {}

  public get stepTypes(): typeof StepType {
    return StepType;
  }

  public getAllocationTitle(index: number): string {
    return $localize`Allocation` + ` #${index >= 10 ? index : '0' + index}`;
  }
}
