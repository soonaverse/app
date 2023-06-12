import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { DescriptionItemType } from '@components/description/description.component';
import { DeviceService } from '@core/services/device';
import { UnitsService } from '@core/services/units';
import { DataService } from '@pages/proposal/services/data.service';
import { HelperService } from '@pages/proposal/services/helper.service';
import { ProposalType } from '@build-5/interfaces';
import { BehaviorSubject } from 'rxjs';

@Component({
  selector: 'wen-votes',
  templateUrl: './votes.page.html',
  styleUrls: ['./votes.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VotesPage {
  @Input() isGuardianWithinSpace$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  @Output() wenOnExportClick = new EventEmitter<void>();
  @Output() wenOnApprove = new EventEmitter<void>();
  @Output() wenOnReject = new EventEmitter<void>();
  public descriptionLabels: string[] = [
    $localize`Current Milestone`,
    $localize`Commence Date`,
    $localize`Start Date`,
    $localize`End Date`,
    $localize`Voting Type`,
    $localize`Total Weight`,
  ];

  constructor(
    public deviceService: DeviceService,
    public data: DataService,
    public unitsService: UnitsService,
    public helper: HelperService,
  ) {}

  public get descriptionItemTypes(): typeof DescriptionItemType {
    return DescriptionItemType;
  }

  public get proposalTypes(): typeof ProposalType {
    return ProposalType;
  }
}
