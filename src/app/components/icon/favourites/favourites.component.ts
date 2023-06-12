import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'wen-icon-favourites',
  templateUrl: './favourites.component.html',
  styleUrls: ['./favourites.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavouritesIconComponent {
  @Input() size = 24;
  @Input() selected = false;
}
