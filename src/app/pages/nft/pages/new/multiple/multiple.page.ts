/* eslint-disable no-invalid-this */
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FileApi } from '@api/file.api';
import { NftApi } from '@api/nft.api';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { AuthService } from '@components/auth/services/auth.service';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { NotificationService } from '@core/services/notification';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { download } from '@core/utils/tools.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/nft/services/data.service';
import { HelperService } from '@pages/nft/services/helper.service';
import {
  COL,
  Collection,
  CollectionType,
  FILENAME_REGEXP,
  MAX_IOTA_AMOUNT,
  MIN_IOTA_AMOUNT,
} from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import {
  NzUploadChangeParam,
  NzUploadFile,
  NzUploadXHRArgs,
  UploadFilter,
} from 'ng-zorro-antd/upload';
import Papa from 'papaparse';
import { BehaviorSubject, from, Observable, of, Subscription } from 'rxjs';
import { StepType } from '../new.page';

export interface NFTObject {
  [key: string]: {
    label: string;
    validate: (value: any) => boolean;
    required: boolean;
    fields?: string[];
    value?: () => any;
    defaultAmount?: number;
  };
}

@UntilDestroy()
@Component({
  selector: 'wen-multiple',
  templateUrl: './multiple.page.html',
  styleUrls: ['./multiple.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MultiplePage implements OnInit {
  public collectionControl: FormControl = new FormControl('');
  public nftForm: FormGroup;
  public stepType = StepType;
  public currentStep = StepType.GENERATE;
  public previewNft?: any | null;
  public uploadedFiles: NzUploadFile[] = [];
  public price?: number | null;
  public availableFrom?: Date | null;
  public nfts: any[] = [];
  public nftErrors: any[] = [];
  public allowedFileFormats = 'jpg/jpeg/png/webp/mp4';
  public uploadFilter: UploadFilter[] = [];
  public uploadErrors: string[] = [];
  public imagesLimit = 500;
  public collection?: Collection;
  public generateClicked = false;
  public startSuccessCounter = 0;
  public filteredCollections$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  private collectionSubscription?: Subscription;
  private usedFileNames = new Set<string>();
  public nftObject: NFTObject = {
    media: {
      label: 'media',
      required: true,
      validate: (value: string) => {
        if (!value) return false;
        if (this.usedFileNames.has(value)) {
          return false;
        }
        const result = !!this.uploadedFiles.find((f: NzUploadFile) => f.name === value);
        if (result) {
          this.usedFileNames.add(value);
        }
        return result;
      },
    },
    name: {
      label: 'name',
      required: true,
      validate: (value: string) => !!value,
    },
    description: {
      label: 'description',
      required: true,
      validate: (value: string) => !!value,
    },
    price: {
      label: 'price',
      required: true,
      validate: (value: string) => {
        if (this.price) return true;
        const price = Number(value);
        if (!value || isNaN(price) || price < MIN_IOTA_AMOUNT || price > MAX_IOTA_AMOUNT)
          return false;
        return true;
      },
      value: () => this.price,
    },
    availableFrom: {
      label: 'available_from',
      required: true,
      validate: (value: string) => {
        if (this.availableFrom) {
          return true;
        }

        if (!value || !dayjs(value).isValid()) {
          return false;
        }

        const d = dayjs(value);
        return dayjs().toDate().getTime() < d.toDate().getTime();
      },
      value: () => this.availableFrom,
    },
    property: {
      label: 'prop',
      required: false,
      fields: ['label', 'value'],
      validate: () => true,
      defaultAmount: 5,
    },
    stat: {
      label: 'stat',
      required: false,
      fields: ['label', 'value'],
      validate: () => true,
      defaultAmount: 5,
    },
  };

  constructor(
    public deviceService: DeviceService,
    public cache: CacheService,
    public data: DataService,
    public helper: HelperService,
    public unitsService: UnitsService,
    public readonly algoliaService: AlgoliaService,
    private nzNotification: NzNotificationService,
    private notification: NotificationService,
    private auth: AuthService,
    private fileApi: FileApi,
    private route: ActivatedRoute,
    private cd: ChangeDetectorRef,
    private nftApi: NftApi,
    private router: Router,
  ) {
    this.nftForm = new FormGroup({
      collection: this.collectionControl,
    });
  }

  public ngOnInit(): void {
    this.collectionControl.valueChanges.pipe(untilDestroyed(this)).subscribe((o) => {
      this.cache.getCollection(o).subscribe((finObj) => {
        if (finObj) {
          this.reset();
          this.collection = finObj;
          if (
            this.collection &&
            (this.collection.type === CollectionType.GENERATED ||
              this.collection.type === CollectionType.SFT)
          ) {
            this.price = this.collection.price || 0;
            this.availableFrom = (
              this.collection.availableFrom || this.collection.createdOn
            ).toDate();
          } else {
            this.price = null;
            this.availableFrom = null;
          }

          this.filteredCollections$.next([
            {
              label: finObj.name || finObj.uid,
              value: finObj.uid,
            },
          ]);
        }
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
            if (this.isValidFileName(file.name)) {
              res.push(file);
            } else {
              this.uploadErrors.push(`File name ${file.name} is not valid`);
            }
          });
          this.cd.markForCheck();
          return res;
        },
      },
    ];
  }

  public uploadMultipleFiles(item: NzUploadXHRArgs): Subscription {
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

  public uploadMultipleChange(event: NzUploadChangeParam): void {
    if (event.type === 'start') {
      this.startSuccessCounter++;
    }
    if (event.type === 'success') {
      this.startSuccessCounter--;
      this.uploadedFiles.push(event.file);
    } else if (event.type === 'removed') {
      this.uploadedFiles = this.uploadedFiles.filter(
        (f: NzUploadFile) => f.name !== event.file.name,
      );
    }
    this.cd.markForCheck();
  }

  public formatSubmitData(data: any): any {
    const res: any = {};

    if (data.property && data.property.length > 0) {
      const obj = data.property
        .map((s: { [key: string]: string }) => ({
          key: Object.keys(s)[0],
          value: Object.values(s)[0],
        }))
        .filter((s: { [key: string]: string }) => s.key && s.value)
        .reduce((acc: any, cur: any) => {
          const index = Number(
            cur.key.substring(cur.key.split('').findIndex((c: any) => !isNaN(c))),
          );
          const key = `prop${index}`;
          const newObj = acc[key] || {};
          if (cur.key.includes('label')) {
            newObj.label = cur.value;
          } else {
            newObj.value = cur.value;
          }
          return { ...acc, [key]: newObj };
        }, {});

      const filteredObj = Object.keys(obj).filter(
        (key: string) => obj[key].label && obj[key].value,
      );

      if (filteredObj.length > 0) {
        res.properties = filteredObj.reduce(
          (acc: any, key: string) => ({
            ...acc,
            [obj[key].label.replace(/\s/g, '').toLowerCase()]: obj[key],
          }),
          {},
        );
      }
    }

    if (data.stat && data.stat.length > 0) {
      const obj = data.stat
        .map((s: { [key: string]: string }) => ({
          key: Object.keys(s)[0],
          value: Object.values(s)[0],
        }))
        .filter((s: { [key: string]: string }) => s.key && s.value)
        .reduce((acc: any, cur: any) => {
          const index = Number(
            cur.key.substring(cur.key.split('').findIndex((c: any) => !isNaN(c))),
          );
          const key = `stat${index}`;
          const newObj = acc[key] || {};
          if (cur.key.includes('label')) {
            newObj.label = cur.value;
          } else {
            newObj.value = cur.value;
          }
          return { ...acc, [key]: newObj };
        }, {});

      const filteredObj = Object.keys(obj).filter(
        (key: string) => obj[key].label && obj[key].value,
      );

      if (filteredObj.length > 0) {
        res.stats = filteredObj.reduce(
          (acc: any, key: string) => ({
            ...acc,
            [obj[key].label.replace(/\s/g, '').toLowerCase()]: obj[key],
          }),
          {},
        );
      }
    }

    res.name = data.name;
    res.description = data.description;
    res.price = Number(data.price);
    res.collection = this.collectionControl.value;
    res.media = this.uploadedFiles.find((f: NzUploadFile) => f.name === data.media)?.response;
    res.availableFrom = dayjs(data.availableFrom).toDate();
    return res;
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

  public beforeCSVUpload(file: NzUploadFile): boolean | Observable<boolean> {
    if (!file) return false;
    this.nftErrors = [];
    this.usedFileNames.clear();

    Papa.parse(file as unknown as File, {
      skipEmptyLines: true,
      complete: (results: any) => {
        // Use this nfts for multiple upload
        const nfts = results.data
          .slice(1, results.data.length)
          .map((row: string[]) =>
            row.reduce(
              (acc: any, cur: string, index: number) => ({ ...acc, [results.data[0][index]]: cur }),
              {},
            ),
          )
          .map((nft: any) => {
            const newFields: any = {};
            if (this.availableFrom) {
              newFields.available_from = this.availableFrom;
            }
            if (this.price) {
              newFields.price = this.price;
            }
            return { ...nft, ...newFields };
          })
          .map((nft: any) => {
            const errors: string[] = [];
            Object.values(this.nftObject).forEach((field) => {
              if (field.required) {
                const isValid = field.fields
                  ? Object.keys(nft)
                      .filter((key: string) => key.startsWith(field.label))
                      .every((key: string) => field.validate(nft[key]))
                  : field.validate(nft[field.label]);
                if (!isValid) {
                  errors.push(`Invalid ${field.label}`);
                }
              }
            });
            this.nftErrors.push(errors);
            return nft;
          })
          .map((nft: any) =>
            Object.keys(nft).reduce((acc: any, key: string) => {
              const fieldKey =
                Object.keys(this.nftObject).find((k) => key.startsWith(this.nftObject[k].label)) ||
                '';
              const value = nft[key];
              return this.nftObject[fieldKey]?.fields
                ? { ...acc, [fieldKey]: [...(acc[fieldKey] || []), { [key]: value }] }
                : { ...acc, [fieldKey]: value };
            }, {}),
          );
        this.currentStep = StepType.PUBLISH;
        this.nfts = nfts.map((nft: any) => this.formatSubmitData(nft));
        this.cd.markForCheck();
      },
    });
    return false;
  }

  public beforeImagesUpload(file: NzUploadFile): boolean | Observable<boolean> {
    if (!file) return false;
    return this.uploadedFiles.length < this.imagesLimit;
  }

  public buttonClick(): void {
    if (this.currentStep === StepType.GENERATE) {
      this.generate();
      this.generateClicked = true;
      this.cd.markForCheck();
    } else {
      this.publish();
    }
  }

  public generate(): void {
    const fields = [
      '',
      ...Object.values(this.nftObject)
        .filter((item) => !item.value || !item.value())
        .map((item) =>
          item.fields
            ? [...Array(item.defaultAmount).keys()].map((num: number) =>
                (item?.fields || []).map((f) => `${item.label}.${f}${num + 1}`),
              )
            : [item.label],
        )
        .flat(Infinity),
    ] as string[];

    const data = this.uploadedFiles.map((file: NzUploadFile) => [
      file.name,
      ...fields.slice(2, fields.length).map(() => ''),
    ]);

    const csv = Papa.unparse({
      fields,
      data,
    });

    download(`data:text/csv;charset=utf-8${csv}`, 'soonaverse_NFT_list.csv');
  }

  public async publish(): Promise<void> {
    if (!this.nfts?.length) return;

    await this.auth.sign(this.nfts, (sc, finish) => {
      this.notification
        .processRequest(this.nftApi.batchCreate(sc), 'Created.', finish)
        .subscribe(() => {
          this.router.navigate([ROUTER_UTILS.config.collection.root, this.collectionControl.value]);
        });
    });
  }

  public trackByName(index: number, item: any): number {
    return item.name;
  }

  public removeNft(index: number): void {
    this.nfts = this.nfts.filter((nft: any, i: number) => i !== index);
    this.nftErrors = this.nftErrors.filter((nftError: any, i: number) => i !== index);
  }

  public isNftError(): boolean {
    return this.nftErrors.some((nftErrors: string[]) => nftErrors.length);
  }

  public getMediaName(mediaResponse: string): string {
    return this.uploadedFiles.find((f: NzUploadFile) => f.response === mediaResponse)?.name || '';
  }

  public reset(): void {
    this.currentStep = StepType.GENERATE;
    this.previewNft = null;
    this.price = null;
    this.availableFrom = null;
    this.nfts = [];
    this.nftErrors = [];
    this.usedFileNames.clear();
    this.uploadedFiles = [];
    this.uploadFilter = [];
    this.uploadErrors = [];
  }

  private isValidFileName(str: string): boolean {
    const dotIndex = str.indexOf('.');
    return (
      dotIndex > -1 &&
      FILENAME_REGEXP.test(str.substring(0, dotIndex)) &&
      this.allowedFileFormats.split('/').includes(str.substring(dotIndex + 1))
    );
  }
}
