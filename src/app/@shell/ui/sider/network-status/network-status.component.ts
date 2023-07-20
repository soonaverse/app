import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  HostListener,
  OnInit,
} from '@angular/core';
import { DeviceService } from '@core/services/device';
import { environment } from '@env/environment';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Milestone, Network, PROD_NETWORKS, TEST_NETWORKS } from '@build-5/interfaces';
import dayjs from 'dayjs';
import { BehaviorSubject } from 'rxjs';
import { MilestoneApi } from '@api/milestone.api';

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
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.milestoneApi.getTopMilestonesLive().subscribe((milestones) => {
      this.lastIotaMilestone$.next(milestones[Network.IOTA]);
      this.lastAtoiMilestone$.next(milestones[Network.ATOI]);
      this.lastSmrMilestone$.next(milestones[Network.SMR]);
      this.lastRmsMilestone$.next(milestones[Network.RMS]);
    });
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
