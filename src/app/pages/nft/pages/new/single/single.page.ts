import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FileApi } from '@api/file.api';
import { NftApi } from '@api/nft.api';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { AuthService } from '@components/auth/services/auth.service';
import { SelectCollectionOption } from '@components/collection/components/select-collection/select-collection.component';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/nft/services/data.service';
import {
  COL,
  Collection,
  CollectionType,
  FILENAME_REGEXP,
  MAX_IOTA_AMOUNT,
  MAX_PROPERTIES_COUNT,
  MAX_STATS_COUNT,
  MIN_IOTA_AMOUNT,
  PRICE_UNITS,
  Units,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { DisabledTimeConfig } from 'ng-zorro-antd/date-picker';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import {
  NzUploadChangeParam,
  NzUploadFile,
  NzUploadXHRArgs,
  UploadFilter,
} from 'ng-zorro-antd/upload';
import { BehaviorSubject, Observable, Subscription, from, of } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-single',
  templateUrl: './single.page.html',
  styleUrls: ['./single.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SinglePage implements OnInit, OnDestroy {
  public nameControl: FormControl = new FormControl('', Validators.required);
  public descriptionControl: FormControl = new FormControl('', Validators.required);
  public priceControl: FormControl = new FormControl(null, Validators.required);
  public availableFromControl: FormControl = new FormControl('', Validators.required);
  public mediaControl: FormControl = new FormControl('', Validators.required);
  public collectionControl: FormControl = new FormControl('');
  public collection?: Collection;
  public properties: FormArray;
  public stats: FormArray;
  public nftForm: FormGroup;
  public uploadedFile?: NzUploadFile | null;
  public previewNft = null;
  public minimumPrice = MIN_IOTA_AMOUNT;
  public maximumPrice = MAX_IOTA_AMOUNT;
  public uploadFilter: UploadFilter[] = [];
  public fileUploadError: string | null = null;
  public allowedFileFormats = 'jpg/jpeg/png/webp/mp4';
  public filteredCollections$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  private collectionSubscription?: Subscription;

  constructor(
    public deviceService: DeviceService,
    public cache: CacheService,
    public data: DataService,
    public readonly algoliaService: AlgoliaService,
    private cd: ChangeDetectorRef,
    private nzNotification: NzNotificationService,
    private notification: NotificationService,
    private nftApi: NftApi,
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    private fileApi: FileApi,
  ) {
    this.properties = new FormArray([] as FormGroup[]);
    this.stats = new FormArray([] as FormGroup[]);

    this.nftForm = new FormGroup({
      name: this.nameControl,
      description: this.descriptionControl,
      price: this.priceControl,
      availableFrom: this.availableFromControl,
      media: this.mediaControl,
      collection: this.collectionControl,
      properties: this.properties,
      stats: this.stats,
    });
  }

  public get priceUnits(): Units[] {
    return PRICE_UNITS;
  }

  public get maxPropertyCount(): number {
    return MAX_PROPERTIES_COUNT;
  }

  public get maxStatCount(): number {
    return MAX_STATS_COUNT;
  }

  public ngOnInit(): void {
    this.collectionControl.valueChanges.pipe(untilDestroyed(this)).subscribe((o) => {
      this.cache.getCollection(o).subscribe((finObj) => {
        if (!finObj) {
          return;
        }

        this.collection = finObj || undefined;
        this.priceControl.setValue(finObj.price || 0);
        this.availableFromControl.setValue((finObj.availableFrom || finObj.createdOn).toDate());

        if (finObj.type === CollectionType.GENERATED || finObj.type === CollectionType.SFT) {
          this.priceControl.disable();
          this.availableFromControl.disable();
        } else {
          this.priceControl.enable();
          this.availableFromControl.enable();
        }

        this.filteredCollections$.next([
          {
            label: finObj.name || finObj.uid,
            value: finObj.uid,
          },
        ]);

        this.cd.markForCheck();
      });
    });

    this.route.parent?.params.pipe(untilDestroyed(this)).subscribe((p) => {
      if (p.collection) {
        this.collectionControl.setValue(p.collection);
      }
    });

    this.auth.member$?.pipe(untilDestroyed(this)).subscribe(() => {
      this.cd.markForCheck();
    });

    this.uploadFilter = [
      {
        name: 'filenameFilter',
        fn: (fileList: NzUploadFile[]): NzUploadFile[] | Observable<NzUploadFile[]> => {
          const res: NzUploadFile[] = [];
          fileList.forEach((file: NzUploadFile) => {
            res.push(file);
            if (this.isValidFileName(file.name)) {
              this.fileUploadError = null;
            } else {
              this.fileUploadError = $localize`File name ${file.name} is not valid`;
            }
          });
          this.cd.markForCheck();
          return res;
        },
      },
    ];
  }

  public uploadMediaFile(item: NzUploadXHRArgs): Subscription {
    if (!this.auth.member$.value) {
      const err = $localize`Member seems to log out during the file upload request.`;
      this.nzNotification.error(err, '');
      if (item.onError) {
        item.onError(err, item.file);
      }

      return of(undefined).subscribe();
    }
    return this.fileApi.upload(this.auth.member$.value.uid, item);
  }

  public uploadMediaChange(event: NzUploadChangeParam): void {
    if (event.type === 'success') {
      this.mediaControl.setValue(event.file.response);
      this.uploadedFile = event.file;
    } else if (event.type === 'removed') {
      this.mediaControl.setValue('');
      this.fileUploadError = null;
    }
  }

  private validateForm(): boolean {
    this.nftForm.updateValueAndValidity();
    if (!this.nftForm.valid) {
      Object.values(this.nftForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });

      return false;
    }

    return !this.fileUploadError;
  }

  private getPropertyForm(): FormGroup {
    return new FormGroup({
      name: new FormControl(''),
      value: new FormControl(''),
    });
  }

  public disabledStartDate(startValue: Date): boolean {
    // Disable past dates & today + 1day startValue
    if (startValue.getTime() < dayjs().subtract(1, 'day').toDate().getTime()) {
      return true;
    }

    return false;
  }

  private range(start: number, end: number): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  }

  public disabledDateTime(startValue: Date | Date[]): DisabledTimeConfig {
    if (!Array.isArray(startValue) && dayjs(startValue).isSame(dayjs(), 'day')) {
      return {
        nzDisabledHours: () => this.range(0, dayjs().hour()),
        nzDisabledMinutes: () => this.range(0, dayjs().minute()),
        nzDisabledSeconds: () => [],
      };
    } else {
      return {
        nzDisabledHours: () => [],
        nzDisabledMinutes: () => [],
        nzDisabledSeconds: () => [],
      };
    }
  }

  public addProperty(): void {
    if (this.properties.controls.length < MAX_PROPERTIES_COUNT) {
      this.properties.push(this.getPropertyForm());
    }
  }

  public removeProperty(index: number): void {
    this.properties.removeAt(index);
  }

  public getStatForm(): FormGroup {
    return new FormGroup({
      name: new FormControl(''),
      value: new FormControl(''),
    });
  }

  private subscribeCollectionList(search?: string): void {
    this.collectionSubscription?.unsubscribe();
    this.collectionSubscription = from(
      this.algoliaService.searchClient
        .initIndex(COL.COLLECTION)
        .search(search || '', { length: 5, offset: 0 }),
    ).subscribe((r) => {
      this.filteredCollections$.next(
        r.hits.map((r) => {
          const collection = r as unknown as Collection;
          return {
            label: collection.name || collection.uid,
            value: collection.uid,
          };
        }),
      );
    });
  }

  public searchCollection(v: string): void {
    if (v) {
      this.subscribeCollectionList(v);
    }
  }

  public addStat(): void {
    if (this.stats.controls.length < MAX_STATS_COUNT) {
      this.stats.push(this.getStatForm());
    }
  }

  public removeStat(index: number): void {
    this.stats.removeAt(index);
  }

  public gForm(f: any, value: string): any {
    return f.get(value);
  }

  public formatSubmitData(data: any): any {
    const stats: any = {};
    data.stats.forEach((v: any) => {
      if (v.name) {
        const formattedKey: string = v.name.replace(/\s/g, '').toLowerCase();
        stats[formattedKey] = {
          label: v.name,
          value: v.value,
        };
      }
    });
    if (Object.keys(stats).length) {
      data.stats = stats;
    } else {
      delete data.stats;
    }

    const properties: any = {};
    data.properties.forEach((v: any) => {
      if (v.name) {
        const formattedKey: string = v.name.replace(/\s/g, '').toLowerCase();
        properties[formattedKey] = {
          label: v.name,
          value: v.value,
        };
      }
    });
    if (Object.keys(properties).length) {
      data.properties = properties;
    } else {
      delete data.properties;
    }

    data.availableFrom = this.availableFromControl.value;
    delete data.unit;
    return data;
  }

  public async create(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    const formSub = this.nftForm.value;
    // Price might be disabled and not included. It must be always included
    formSub.price = this.nftForm.get('price')?.value;
    await this.auth.sign(this.formatSubmitData({ ...formSub }), (sc, finish) => {
      this.notification.processRequest(this.nftApi.create(sc), 'Created.', finish).subscribe(() => {
        this.router.navigate([ROUTER_UTILS.config.collection.root, this.collectionControl.value]);
      });
    });
  }

  public preview(): void {
    if (!this.validateForm()) {
      return;
    }

    this.previewNft = this.formatSubmitData({ ...this.nftForm.value });
  }

  public trackByValue(index: number, item: SelectCollectionOption) {
    return item.value;
  }

  private isValidFileName(str: string): boolean {
    const dotIndex = str.indexOf('.');
    return (
      dotIndex > -1 &&
      FILENAME_REGEXP.test(str.substring(0, dotIndex)) &&
      this.allowedFileFormats.split('/').includes(str.substring(dotIndex + 1))
    );
  }

  public ngOnDestroy(): void {
    this.collectionSubscription?.unsubscribe();
  }
}
