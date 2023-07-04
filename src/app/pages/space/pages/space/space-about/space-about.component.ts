import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { download } from '@core/utils/tools.utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/collection/services/helper.service';
import { DataService, SpaceAction } from '@pages/space/services/data.service';
import {
  FILE_SIZES,
  Member,
  QUERY_MAX_LENGTH,
  SOON_SPACE,
  SOON_SPACE_TEST,
  Space,
  SpaceMember,
  StakeType,
  getDefDecimalIfNotSet,
} from '@build-5/interfaces';
import Papa from 'papaparse';
import { Observable, Subscription, combineLatest, first, map, skip } from 'rxjs';
import { SpaceApi } from './../../../../../@api/space.api';
import { EntityType } from './../../../../../components/wallet-address/wallet-address.component';

@UntilDestroy()
@Component({
  selector: 'wen-space-about',
  templateUrl: './space-about.component.html',
  styleUrls: ['./space-about.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpaceAboutComponent implements OnInit, OnDestroy {
  @Input() avatarUrl?: string;
  @Output() wenOnLeave = new EventEmitter<void>();
  public isManageAddressesOpen = false;
  public exportingMembers = false;
  public openTokenStake = false;
  public openSpaceClaim = false;
  public amount?: number = undefined;
  private spacesSubscription?: Subscription;

  constructor(
    public deviceService: DeviceService,
    public unitsService: UnitsService,
    public data: DataService,
    public previewImageService: PreviewImageService,
    public auth: AuthService,
    public helper: HelperService,
    private spaceApi: SpaceApi,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.data.triggerAction$.pipe(skip(1), untilDestroyed(this)).subscribe((s) => {
      if (s === SpaceAction.EXPORT_CURRENT_MEMBERS) {
        this.exportMembers();
      } else if (s === SpaceAction.MANAGE_ADDRESSES) {
        this.isManageAddressesOpen = true;
        this.cd.markForCheck();
      }
    });
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }
  public openStakeModal(amount?: number): void {
    this.amount = amount
      ? amount / Math.pow(10, getDefDecimalIfNotSet(this.data.token$.value?.decimals))
      : undefined;
    this.openTokenStake = true;
    this.cd.markForCheck();
  }

  public get walletAddressEntities(): typeof EntityType {
    return EntityType;
  }

  public trackByUid(index: number, item: Member) {
    return item.uid;
  }

  public getShareUrl(space?: Space | null): string {
    return space?.wenUrl || window?.location.href;
  }

  public loggedInUserStake(): Observable<number> {
    return this.data.tokenDistribution$.pipe(
      map((v) => {
        return (
          (v?.stakes?.[StakeType.DYNAMIC]?.amount || 0) +
          (v?.stakes?.[StakeType.STATIC]?.amount || 0)
        );
      }),
    );
  }

  public stakePrc(): Observable<number> {
    return combineLatest([this.data.token$, this.data.tokenStats$]).pipe(
      map(([token, stats]) => {
        const totalStaked =
          (stats?.stakes?.[StakeType.DYNAMIC]?.amount || 0) +
          (stats?.stakes?.[StakeType.STATIC]?.amount || 0);
        return totalStaked / (token?.totalSupply || 0);
      }),
    );
  }

  public stakeTotal(): Observable<number> {
    return this.data.tokenStats$.pipe(
      map((stats) => {
        return (
          (stats?.stakes?.[StakeType.DYNAMIC]?.stakingMembersCount || 0) +
          (stats?.stakes?.[StakeType.STATIC]?.stakingMembersCount || 0)
        );
      }),
    );
  }

  public async exportMembers(): Promise<void> {
    const space = this.data.space$.value;
    if (this.exportingMembers || !space?.uid) {
      return;
    }
    this.exportingMembers = true;

    const data: string[][] = [];
    let members: SpaceMember[] = [];
    do {
      const last = data[data.length - 1]?.[0];
      members = await this.spaceApi.getMembersWithoutData(space.uid, last);
      data.push(...members.map((m) => [m.uid]));
      if (members.length < QUERY_MAX_LENGTH) {
        break;
      }
    } while (members.length);

    this.exportingMembers = false;
    const fields = ['', 'address'];
    const csv = Papa.unparse({ fields, data });

    const filteredSpaceName = space?.name?.toLowerCase().replace(/[^a-zA-Z0-9-_]/g, '');
    download(`data:text/csv;charset=utf-8${csv}`, `soonaverse_${filteredSpaceName}_members.csv`);
    this.cd.markForCheck();
  }

  public isSoonSpace(): Observable<boolean> {
    return this.data.space$.pipe(
      map((s) => {
        return s?.uid === (environment.production ? SOON_SPACE : SOON_SPACE_TEST);
      }),
    );
  }

  public ngOnDestroy(): void {
    this.spacesSubscription?.unsubscribe();
  }
}
