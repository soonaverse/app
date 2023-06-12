import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SeoService } from '@core/services/seo';
import { DataService } from './../../services/data.service';

@Component({
  selector: 'wen-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.less'],
})
export class OverviewPage implements OnInit {
  constructor(public data: DataService, private seo: SeoService) {
    // none.
  }

  public ngOnInit(): void {
    this.seo.setTags($localize`Award -`, undefined, this.data.space$.value?.bannerUrl);
  }
}
