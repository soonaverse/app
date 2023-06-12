import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { UntilDestroy } from '@ngneat/until-destroy';
import { DataService, SpaceAction } from '@pages/space/services/data.service';
import { Subscription } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-manage',
  templateUrl: './manage.page.html',
  styleUrls: ['./manage.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagePage implements OnDestroy {
  private subscriptions$: Subscription[] = [];
  public isAuditOneModalOpen = false;
  public isImportTokenVisible = false;
  constructor(
    public data: DataService,
    public deviceService: DeviceService,
    private cd: ChangeDetectorRef,
  ) {}

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public openAuditOneModal() {
    this.isAuditOneModalOpen = true;
    this.cd.markForCheck();
  }

  public closeAuditOneModal(): void {
    this.isAuditOneModalOpen = false;
    this.cd.markForCheck();
  }

  public manageAddresses(): void {
    this.data.triggerAction$.next(SpaceAction.MANAGE_ADDRESSES);
  }

  public exportCurrentMembers(): void {
    this.data.triggerAction$.next(SpaceAction.EXPORT_CURRENT_MEMBERS);
  }

  public stakingRewardSchedule(): void {
    this.data.triggerAction$.next(SpaceAction.STAKING_REWARD_SCHEDULE);
  }

  public exportCurrentStakers(): void {
    this.data.triggerAction$.next(SpaceAction.EXPORT_CURRENT_STAKERS);
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
