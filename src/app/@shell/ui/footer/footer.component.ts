import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'wen-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  // No need to inject NftSelectionService or maintain selectedCount$
  constructor() { }
}
