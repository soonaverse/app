import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Access, Nft } from '@build-5/interfaces';

@Component({
  selector: 'wen-collection-access-badge',
  templateUrl: './collection-access-badge.component.html',
  styleUrls: ['./collection-access-badge.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessBadgeComponent {
  @Input() type!: Access;
  @Input() nft?: Nft;

  public get accessTypes(): typeof Access {
    return Access;
  }
}
