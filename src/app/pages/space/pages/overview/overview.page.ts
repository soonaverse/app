import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/space/services/data.service';
import { Award, Proposal, Token, TokenStatus } from '@build-5/interfaces';
import dayjs from 'dayjs';
import { Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-overview',
  templateUrl: './overview.page.html',
  styleUrls: ['./overview.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OverviewPage implements OnInit, OnDestroy {
  public spaceId?: string;
  public filteredToken?: Token | null;
  private subscriptions$: Subscription[] = [];

  constructor(
    public data: DataService,
    private route: ActivatedRoute,
    private router: Router,
    private cd: ChangeDetectorRef,
    private seo: SeoService,
  ) {}

  public ngOnInit(): void {
    this.route.parent?.params.subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.space.space.replace(':', '')];
      if (id) {
        this.cancelSubscriptions();
        this.spaceId = id;
      } else {
        this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
      }
    });

    this.data.token$.pipe(untilDestroyed(this)).subscribe((token: Token | undefined) => {
      this.filteredToken =
        token?.saleStartDate && token?.status === TokenStatus.AVAILABLE ? token : null;
      this.cd.markForCheck();
    });

    this.data.space$.pipe(untilDestroyed(this)).subscribe((s) => {
      this.seo.setTags($localize`Space -` + ' ' + s?.name, s?.about, s?.bannerUrl);
    });
  }

  public available(token?: Token): boolean {
    return (
      !!token &&
      !!token.saleStartDate &&
      dayjs(token.saleStartDate?.toDate())
        .add(token.saleLength || 0, 'ms')
        .isAfter(dayjs()) &&
      token?.status === TokenStatus.AVAILABLE &&
      token?.approved
    );
  }

  public isBeforeSale(token?: Token): boolean {
    return (
      !!token &&
      !!token.saleStartDate &&
      dayjs(token.saleStartDate?.toDate()).isAfter(dayjs()) &&
      token?.status === TokenStatus.AVAILABLE &&
      token?.approved
    );
  }

  public trackByUid(index: number, item: Award | Proposal) {
    return item.uid;
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
