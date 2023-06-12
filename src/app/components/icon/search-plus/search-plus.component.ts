import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-search-plus',
  templateUrl: './search-plus.component.html',
  styleUrls: ['./search-plus.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchPlusIconComponent {
  @Input() size = 24;
}
