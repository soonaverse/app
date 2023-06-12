import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FileApi } from '@api/file.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DescriptionItemType } from '@components/description/description.component';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UnitsService } from '@core/services/units';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/nft/services/data.service';
import { HelperService } from '@pages/nft/services/helper.service';
import { FILE_SIZES, Nft, Space } from '@build-5/interfaces';
import { switchMap, take } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-nft-preview',
  templateUrl: './nft-preview.component.html',
  styleUrls: ['./nft-preview.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftPreviewComponent {
  @Input()
  set nft(value: Nft | null) {
    this._nft = value;
    this.cache
      .getCollection(this.nft?.collection)
      .pipe(
        switchMap((collection) => this.cache.getSpace(collection?.space)),
        untilDestroyed(this),
      )
      .subscribe((space?: Space) => {
        this.space = space;
        this.cd.markForCheck();
      });
    if (this.nft) {
      this.fileApi
        .getMetadata(this.nft.media)
        .pipe(take(1), untilDestroyed(this))
        .subscribe((o) => {
          this.mediaType = o;
          this.cd.markForCheck();
        });
    }
  }

  get nft(): any | null {
    return this._nft;
  }

  @Output() wenOnClose = new EventEmitter<void>();

  public space?: Space;
  public mediaType: 'video' | 'image' | undefined;
  public systemInfoLabels: string[] = [$localize`IPFS Metadata`, $localize`IPFS Image`];
  public systemInfoValues: { [key: string]: string } = {
    preparing: $localize`Available once minted...`,
  };
  private _nft: any | null;

  constructor(
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
    public helper: HelperService,
    public unitsService: UnitsService,
    public data: DataService,
    public auth: AuthService,
    public cache: CacheService,
    private cd: ChangeDetectorRef,
    private fileApi: FileApi,
  ) {}

  public close(): void {
    this.nft = null;
    this.wenOnClose.next();
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public getValues(obj: Nft) {
    return Object.values(obj).map(({ label, value }) => ({
      title: label,
      value,
      type: DescriptionItemType.DEFAULT_NO_TRUNCATE,
    }));
  }
}
