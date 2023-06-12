import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { FileApi } from '@api/file.api';
import { AuthService } from '@components/auth/services/auth.service';
import { FILE_SIZES, Space } from '@build-5/interfaces';
import { ROUTER_UTILS } from './../../../../@core/utils/router.utils';

@Component({
  selector: 'wen-space-card',
  templateUrl: './space-card.component.html',
  styleUrls: ['./space-card.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceCardComponent {
  @Input() public space?: Space;
  public path = ROUTER_UTILS.config.space.root;

  constructor(public auth: AuthService) {}

  public get avatarUrl(): string | undefined {
    return this.space?.avatarUrl
      ? FileApi.getUrl(this.space.avatarUrl, FILE_SIZES.small)
      : undefined;
  }

  public get bannerUrl(): string | undefined {
    return this.space?.bannerUrl
      ? FileApi.getUrl(this.space.bannerUrl, FILE_SIZES.medium)
      : undefined;
  }
}
