import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Collection } from '@build-5/interfaces';

@Component({
  selector: 'wen-collection-status',
  templateUrl: './collection-status.component.html',
  styleUrls: ['./collection-status.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionStatusComponent {
  @Input() collection?: Collection | null;
}
