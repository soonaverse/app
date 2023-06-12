import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { NavigationService } from '@core/services/navigation/navigation.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'wen-content',
  templateUrl: './content.component.html',
  styleUrls: ['./content.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContentComponent implements OnInit {
  @Input() showBackButton = false;

  public title: Observable<string> = of('');

  constructor(public nav: NavigationService, public device: DeviceService) {}

  ngOnInit(): void {
    this.title = this.nav.getTitle();
  }
}
