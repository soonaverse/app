import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-member-tile',
  templateUrl: './member-tile.component.html',
  styleUrls: ['./member-tile.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberTileComponent {
  @Input() public title = '';
  @Input() public value = 0;
}
