import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-members-with-nft-from-collection',
  templateUrl: './members-with-nft-from-collection.component.html',
  styleUrls: ['./members-with-nft-from-collection.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MembersWithNftFromCollectionIconComponent {
  @Input() size = 24;
}
