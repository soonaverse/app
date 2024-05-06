import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { Member, Space } from '@buildcore/interfaces';

@Component({
  selector: 'wen-member-space-row',
  templateUrl: './member-space-row.component.html',
  styleUrls: ['./member-space-row.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberSpaceRowComponent {
  @Input() space?: Space;
  @Input() member?: Member;

  public isReputationVisible = false;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
  ) {}

  public getSpaceRoute(): string[] {
    return ['/', ROUTER_UTILS.config.space.root, this.space?.uid || ''];
  }
}
