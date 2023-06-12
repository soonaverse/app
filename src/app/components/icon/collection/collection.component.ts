import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-collection',
  templateUrl: './collection.component.html',
  styleUrls: ['./collection.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionIconComponent {
  @Input() size = 24;
}
