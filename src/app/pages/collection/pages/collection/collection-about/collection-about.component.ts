import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { SpaceApi } from '@api/space.api';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/collection/services/helper.service';
import { Access, FILE_SIZES, Network } from '@soonaverse/interfaces';
import { BehaviorSubject, combineLatest, of, switchMap } from 'rxjs';
import { DataService } from '../../../services/data.service';

@UntilDestroy()
@Component({
  selector: 'wen-collection-about',
  templateUrl: './collection-about.component.html',
  styleUrls: ['./collection-about.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionAboutComponent implements OnInit {
  public isMintOnNetorkVisible = false;
  public isGuardianWithinSpace$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(
    public data: DataService,
    public helper: HelperService,
    public deviceService: DeviceService,
    public cache: CacheService,
    public previewImageService: PreviewImageService,
    public unitService: UnitsService,
    private auth: AuthService,
    private spaceApi: SpaceApi,
  ) {
    // none.
  }

  public ngOnInit(): void {
    combineLatest([this.auth.member$, this.data.collection$])
      .pipe(
        switchMap(([member, collection]) => {
          if (member && collection?.space) {
            return this.spaceApi.isGuardianWithinSpace(collection?.space, member?.uid);
          }
          return of(null);
        }),
        untilDestroyed(this),
      )
      .subscribe((isGuardianWithinSpace) => {
        if (isGuardianWithinSpace !== null) {
          this.isGuardianWithinSpace$.next(isGuardianWithinSpace);
        }
      });
  }

  public get access(): typeof Access {
    return Access;
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public get networkTypes(): typeof Network {
    return Network;
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }
}
