import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { MilestoneApi } from '@api/milestone.api';
import { MilestoneAtoiApi } from '@api/milestone_atoi.api';
import { MilestoneRmsApi } from '@api/milestone_rms.api';
import { MilestoneSmrApi } from '@api/milestone_smr.api';
import { DeviceService } from '@core/services/device';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Milestone, Network, PROD_NETWORKS, TEST_NETWORKS } from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject, map } from 'rxjs';

const ESCAPE_KEY = 'Escape';

enum NetworkStatus {
  GREEN = 0,
  YELLOW = 1,
  RED = 2,
}

@UntilDestroy()
@Component({
  selector: 'wen-network-status',
  templateUrl: './network-status.component.html',
  styleUrls: ['./network-status.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkStatusComponent implements OnInit {
  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === ESCAPE_KEY) {
      this.isVisible = false;
      this.cd.markForCheck();
    }
  }

  public isVisible = false;
  public environment = environment;
  public lastIotaMilestone$ = new BehaviorSubject<Milestone | undefined>(undefined);
  public lastAtoiMilestone$ = new BehaviorSubject<Milestone | undefined>(undefined);
  public lastRmsMilestone$ = new BehaviorSubject<Milestone | undefined>(undefined);
  public lastSmrMilestone$ = new BehaviorSubject<Milestone | undefined>(undefined);

  constructor(
    public deviceService: DeviceService,
    private milestoneApi: MilestoneApi,
    private milestoneRmsApi: MilestoneRmsApi,
    private milestoneSmrApi: MilestoneSmrApi,
    private milestonreAtoiApi: MilestoneAtoiApi,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.milestoneApi
      .top(undefined, 1)
      ?.pipe(
        untilDestroyed(this),
        map((o: Milestone[]) => {
          return o[0];
        }),
      )
      .subscribe(this.lastIotaMilestone$);

    this.milestoneRmsApi
      .top(undefined, 1)
      ?.pipe(
        untilDestroyed(this),
        map((o: Milestone[]) => {
          return o[0];
        }),
      )
      .subscribe(this.lastRmsMilestone$);

    this.milestonreAtoiApi
      .top(undefined, 1)
      ?.pipe(
        untilDestroyed(this),
        map((o: Milestone[]) => {
          return o[0];
        }),
      )
      .subscribe(this.lastAtoiMilestone$);

    this.milestoneSmrApi
      .top(undefined, 1)
      ?.pipe(
        untilDestroyed(this),
        map((o: Milestone[]) => {
          return o[0];
        }),
      )
      .subscribe(this.lastSmrMilestone$);
  }

  public isSmrEnabled(): boolean {
    if (environment.production) {
      return PROD_NETWORKS.includes(Network.SMR);
    } else {
      return [...PROD_NETWORKS, ...TEST_NETWORKS].includes(Network.SMR);
    }
  }

  public get networkStatuses(): typeof NetworkStatus {
    return NetworkStatus;
  }

  public getCurrentStatus(m?: Milestone | null): NetworkStatus {
    if (dayjs(m?.createdOn.toDate()).add(5, 'minute').isBefore(dayjs())) {
      return NetworkStatus.RED;
    } else if (dayjs(m?.createdOn.toDate()).add(1, 'minute').isBefore(dayjs())) {
      return NetworkStatus.YELLOW;
    } else {
      return NetworkStatus.GREEN;
    }
  }
}
