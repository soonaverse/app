import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AwardApi } from '@api/award.api';
import { CollectionApi } from '@api/collection.api';
import { FileApi } from '@api/file.api';
import { MemberApi } from '@api/member.api';
import { TokenApi } from '@api/token.api';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { AuthService } from '@components/auth/services/auth.service';
import { SelectCollectionOption } from '@components/collection/components/select-collection/select-collection.component';
import { CacheService } from '@core/services/cache/cache.service';
import { DeviceService } from '@core/services/device';
import { NavigationService } from '@core/services/navigation/navigation.service';
import { NotificationService } from '@core/services/notification';
import { enumToArray } from '@core/utils/manipulations.utils';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Access,
  Award,
  COL,
  Categories,
  Collection,
  CollectionType,
  DEFAULT_NETWORK,
  DISCORD_REGEXP,
  DiscountLine,
  Space,
  TWITTER_REGEXP,
  Token,
  URL_REGEXP,
  getDefDecimalIfNotSet,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import { DisabledTimeConfig } from 'ng-zorro-antd/date-picker';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import { NzUploadChangeParam, NzUploadFile, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { BehaviorSubject, Observable, Subscription, firstValueFrom, from, of } from 'rxjs';
import { first } from 'rxjs/operators';
import { SelectSpaceOption } from '../../../../components/space/components/select-space/select-space.component';

const MAX_DISCOUNT_COUNT = 3;

@UntilDestroy()
@Component({
  selector: 'wen-upsert',
  templateUrl: './upsert.page.html',
  styleUrls: ['./upsert.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpsertPage implements OnInit, OnDestroy {
  public nameControl: FormControl = new FormControl('', Validators.required);
  public descriptionControl: FormControl = new FormControl('', Validators.required);
  public royaltiesFeeControl: FormControl = new FormControl('', Validators.required);
  public urlControl: FormControl = new FormControl('', Validators.pattern(URL_REGEXP));
  public twitterControl: FormControl = new FormControl('', Validators.pattern(TWITTER_REGEXP));
  public discordControl: FormControl = new FormControl('', Validators.pattern(DISCORD_REGEXP));
  public placeholderUrlControl: FormControl = new FormControl('');
  public accessAwardsControl: FormControl = new FormControl([]);
  public accessCollectionsControl: FormControl = new FormControl([]);
  public bannerUrlControl: FormControl = new FormControl('', Validators.required);
  public categoryControl: FormControl = new FormControl('', Validators.required);
  public selectedAccessControl: FormControl = new FormControl(Access.OPEN, Validators.required);
  public spaceControl: FormControl = new FormControl('', Validators.required);
  public royaltiesSpaceControl: FormControl = new FormControl('', Validators.required);
  public royaltiesSpaceDifferentControl: FormControl = new FormControl(false, Validators.required);
  public onePerMemberOnlyControl: FormControl = new FormControl(false);
  public limitedEditionControl: FormControl = new FormControl(false);
  public typeControl: FormControl = new FormControl(CollectionType.CLASSIC, Validators.required);
  public priceControl: FormControl = new FormControl(null, Validators.required);
  public availableFromControl: FormControl = new FormControl('', Validators.required);
  public discounts: FormArray;
  public collectionForm: FormGroup;
  public editMode = false;
  public collectionId?: number;
  public collectionMinted = false;
  public collectionTypes = enumToArray(CollectionType);
  public collectionCategories = enumToArray(Categories);
  public formatterPercent = (value: number): string => `${value} %`;
  public parserPercent = (value: string): string => value.replace(' %', '');
  public uploadedBanner?: NzUploadFile | null;
  public uploadedPlaceholder?: NzUploadFile | null;
  public awards$: BehaviorSubject<Award[] | undefined> = new BehaviorSubject<Award[] | undefined>(
    undefined,
  );
  public spaces$: BehaviorSubject<Space[]> = new BehaviorSubject<Space[]>([]);
  public filteredCollections$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  public filteredAwards$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  public filteredTokens$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  private collectionsSubscription?: Subscription;
  private awardsSubscription?: Subscription;
  private tokensSubscription?: Subscription;
  // Improve
  private tokenCache: {
    [propName: string]: {
      symbol: string;
      decimals: number;
    };
  } = {};

  constructor(
    public cache: CacheService,
    public deviceService: DeviceService,
    public nav: NavigationService,
    private route: ActivatedRoute,
    private collectionApi: CollectionApi,
    private awardApi: AwardApi,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
    private memberApi: MemberApi,
    public readonly algoliaService: AlgoliaService,
    private notification: NotificationService,
    private auth: AuthService,
    private router: Router,
    private nzNotification: NzNotificationService,
    private fileApi: FileApi,
  ) {
    this.discounts = new FormArray([] as FormGroup[]);
    this.collectionForm = new FormGroup({
      name: this.nameControl,
      description: this.descriptionControl,
      space: this.spaceControl,
      type: this.typeControl,
      access: this.selectedAccessControl,
      accessAwards: this.accessAwardsControl,
      accessCollections: this.accessCollectionsControl,
      price: this.priceControl,
      availableFrom: this.availableFromControl,
      royaltiesFee: this.royaltiesFeeControl,
      royaltiesSpace: this.royaltiesSpaceControl,
      royaltiesSpaceDifferent: this.royaltiesSpaceDifferentControl,
      url: this.urlControl,
      twitter: this.twitterControl,
      discord: this.discordControl,
      bannerUrl: this.bannerUrlControl,
      onePerMemberOnly: this.onePerMemberOnlyControl,
      limitedEdition: this.limitedEditionControl,
      placeholderUrl: this.placeholderUrlControl,
      category: this.categoryControl,
      discounts: this.discounts,
    });
  }

  public ngOnInit(): void {
    this.route.params?.pipe(untilDestroyed(this)).subscribe((p) => {
      if (p.space) {
        this.spaceControl.setValue(p.space);
        this.royaltiesSpaceControl.setValue(p.space);
      }
    });

    this.route.params?.pipe(untilDestroyed(this)).subscribe((o) => {
      if (o?.collectionId) {
        this.editMode = true;
        this.collectionId = o.collectionId;
        this.collectionApi
          .listen(o.collectionId)
          .pipe(first())
          .subscribe((o) => {
            if (!o) {
              this.nav.goBack();
            } else {
              this.collectionMinted = false;
              this.nameControl.setValue(o.name);
              this.descriptionControl.setValue(o.description);
              this.spaceControl.setValue(o.space);
              this.descriptionControl.setValue(o.description);
              this.typeControl.setValue(o.type);
              this.priceControl.setValue(o.price);
              this.availableFromControl.setValue(o.availableFrom.toDate());
              this.royaltiesFeeControl.setValue(o.royaltiesFee * 100);
              this.royaltiesSpaceControl.setValue(o.royaltiesSpace);
              this.royaltiesSpaceDifferentControl.setValue(o.royaltiesSpace !== o.space);
              this.accessAwardsControl.setValue(o.accessAwards);
              this.accessCollectionsControl.setValue(o.accessCollections);
              this.placeholderUrlControl.setValue(o.placeholderUrl);
              this.bannerUrlControl.setValue(o.bannerUrl);
              this.urlControl.setValue(o.url);
              this.twitterControl.setValue(o.twitter);
              this.discordControl.setValue(o.discord);
              this.categoryControl.setValue(o.category);
              this.selectedAccessControl.setValue(o.access);
              this.onePerMemberOnlyControl.setValue(o.onePerMemberOnly);
              this.limitedEditionControl.setValue(o.limitedEdition);

              // Disable fields that are not editable.
              this.spaceControl.disable();
              this.typeControl.disable();
              this.categoryControl.disable();
              this.limitedEditionControl.disable();

              // If minted only Access / Discounts can be edited.
              if (o.mintingData) {
                this.collectionMinted = true;
                this.nameControl.disable();
                this.descriptionControl.disable();
                // this.priceControl.disable();
                this.royaltiesFeeControl.disable();
                this.royaltiesSpaceControl.disable();
                this.royaltiesSpaceDifferentControl.disable();
                this.placeholderUrlControl.disable();
                this.bannerUrlControl.disable();
                this.urlControl.disable();
                this.twitterControl.disable();
                this.discordControl.disable();
              }

              // Discounts require async call so we do it at the end.
              this.discounts.removeAt(0);
              o.discounts
                .sort((a, b) => {
                  return a.tokenReward - b.tokenReward;
                })
                .forEach(async (v) => {
                  let token;
                  if (v.tokenUid) {
                    token = await firstValueFrom(this.tokenApi.listen(v.tokenUid));
                  }

                  this.addDiscount(
                    v.tokenReward
                      ? (
                          v.tokenReward / Math.pow(10, getDefDecimalIfNotSet(token?.decimals))
                        ).toString()
                      : '0',
                    token?.uid || '',
                    token?.symbol || '',
                    v.amount ? (v.amount * 100).toString() : '',
                  );

                  if (token) {
                    this.filteredTokens$.next([
                      ...(this.filteredTokens$.value || []),
                      {
                        label: token.name + ' ( ' + token.symbol + ' )',
                        value: token.uid,
                      },
                    ]);
                  }
                });

              // Load selected options for award/collections
              o.accessAwards?.forEach(async (a) => {
                const award: Award = await firstValueFrom(this.awardApi.listen(a));
                if (award) {
                  this.filteredAwards$.next([
                    ...(this.filteredAwards$.value || []),
                    {
                      label:
                        award.name +
                        ' (badge: ' +
                        award.badge.name +
                        ', id: ' +
                        award.uid.substring(0, 10) +
                        ')',
                      value: award.uid,
                    },
                  ]);
                }
              });

              o.accessCollections?.forEach(async (a) => {
                const collection: any = await firstValueFrom(this.collectionApi.listen(a));
                if (collection) {
                  this.filteredCollections$.next([
                    ...(this.filteredCollections$.value || []),
                    {
                      label: collection.name || collection.uid,
                      value: collection.uid,
                    },
                  ]);
                }
              });

              this.cd.markForCheck();
            }
          });
      }
    });

    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((o) => {
      if (o?.uid) {
        this.memberApi.allSpacesAsMember(o.uid).pipe(untilDestroyed(this)).subscribe(this.spaces$);
      }
    });

    // Listen to main space and make sure we always set it as royalty spce.
    this.spaceControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val) => {
      if (this.royaltiesSpaceDifferentControl.value === false) {
        this.royaltiesSpaceControl.setValue(val);
      }
    });

    this.typeControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val) => {
      if (val === CollectionType.CLASSIC) {
        this.placeholderUrlControl.removeValidators(Validators.required);
      } else {
        this.placeholderUrlControl.addValidators(Validators.required);
      }
      this.placeholderUrlControl.updateValueAndValidity();
    });

    this.royaltiesSpaceDifferentControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      if (!this.royaltiesSpaceDifferentControl.value) {
        this.royaltiesSpaceControl.setValue(this.spaceControl.value);
      }
    });
  }

  public get maxDiscountCount(): number {
    return MAX_DISCOUNT_COUNT;
  }

  private subscribeAwardList(search?: string): void {
    this.awardsSubscription?.unsubscribe();
    this.awardsSubscription = from(
      this.algoliaService.searchClient
        .initIndex(COL.AWARD)
        .search(search || '', { length: 5, offset: 0 }),
    ).subscribe((r) => {
      this.filteredAwards$.next(
        r.hits.map((r) => {
          const award = r as unknown as Award;
          return {
            label:
              award.name +
              ' (badge: ' +
              award.badge.name +
              ', id: ' +
              award.uid.substring(0, 10) +
              ')',
            value: award.uid,
          };
        }),
      );
    });
  }

  public searchAward(v: string): void {
    if (v) {
      this.subscribeAwardList(v);
    }
  }

  private subscribeTokenList(search?: string): void {
    this.tokensSubscription?.unsubscribe();
    this.tokensSubscription = from(
      this.algoliaService.searchClient
        .initIndex(COL.TOKEN)
        .search(search || '', { length: 5, offset: 0 }),
    ).subscribe((r) => {
      this.filteredTokens$.next(
        r.hits.map((r) => {
          const token = r as unknown as Token;
          this.tokenCache[token.uid] = {
            symbol: token.symbol,
            decimals: getDefDecimalIfNotSet(token.decimals),
          };
          return {
            label: token.name + ' ( ' + token.symbol + ' )',
            value: token.uid,
          };
        }),
      );
    });
  }

  public searchToken(v: string): void {
    if (v) {
      this.subscribeTokenList(v);
    }
  }

  private subscribeCollectionList(search?: string): void {
    this.collectionsSubscription?.unsubscribe();
    this.collectionsSubscription = from(
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

  private memberIsLoggedOut(item: NzUploadXHRArgs): Subscription {
    const err = $localize`Member seems to log out during the file upload request.`;
    this.nzNotification.error(err, '');
    if (item.onError) {
      item.onError(err, item.file);
    }

    return of(undefined).subscribe();
  }

  public getCollectionListOptions(list?: Collection[] | null): SelectCollectionOption[] {
    return (list || [])
      .filter((o) => o.rejected !== true)
      .map((o) => ({
        label: o.name || o.uid,
        value: o.uid,
        img: o.bannerUrl,
      }));
  }

  public uploadFilePlaceholder(item: NzUploadXHRArgs): Subscription {
    if (!this.auth.member$.value) {
      return this.memberIsLoggedOut(item);
    }

    return this.fileApi.upload(this.auth.member$.value.uid, item);
  }

  public uploadFileBanner(item: NzUploadXHRArgs): Subscription {
    if (!this.auth.member$.value) {
      return this.memberIsLoggedOut(item);
    }

    return this.fileApi.upload(this.auth.member$.value.uid, item);
  }

  public get targetAccess(): typeof Access {
    return Access;
  }

  public uploadChangePlaceholder(event: NzUploadChangeParam): void {
    if (event.type === 'success') {
      this.placeholderUrlControl.setValue(event.file.response);
      this.uploadedPlaceholder = event.file;
    } else {
      this.placeholderUrlControl.setValue('');
    }
  }

  public uploadChangeBanner(event: NzUploadChangeParam): void {
    if (event.type === 'success') {
      this.bannerUrlControl.setValue(event.file.response);
      this.uploadedBanner = event.file;
    } else {
      this.bannerUrlControl.setValue('');
    }
  }

  public showPlaceholder(): boolean {
    return this.typeControl.value !== CollectionType.CLASSIC;
  }

  public previewFile(file: NzUploadFile): Observable<string> {
    return of(file.response);
  }

  public getSpaceListOptions(list?: Space[] | null): SelectSpaceOption[] {
    return (list || [])
      .filter((o) => {
        return !!(o.validatedAddress || {})[DEFAULT_NETWORK];
      })
      .map((o) => ({
        label: o.name || o.uid,
        value: o.uid,
        img: o.avatarUrl,
      }));
  }

  private validateForm(): boolean {
    this.collectionForm.updateValueAndValidity();
    if (!this.collectionForm.valid) {
      Object.values(this.collectionForm.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });

      return false;
    }

    return true;
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  public getTooltip(type: number, tooltip: string): string {
    type === 0
      ? (tooltip =
          'Classic NFTs are the most straightforward in that you upload your images, they’re all visible right away, and people can browse through your collection and purchase what they like. Simply upload and sell!')
      : type === 1
      ? (tooltip =
          'Generated NFTs add a little mystery into the mix. The buyer won’t know what their NFT looks like until they mint it. The owner of the collection has the ability to put in a placeholder image for the entire collection to give the buyer an idea of what the NFT may look like, but their mint will still be a surprise. This is the most common type of NFT (it’s what IOTABOTs did).')
      : (tooltip =
          'SFTs (Semi-Fungible Tokens) are a hybrid between the two approaches above. The collection creator can create a classic NFT, but they have the option to multiply them. For example, they can upload 10 images, but each image will have a quantity of 100. This is a relatively new term in the space, but a good real world example of this approach would be baseball or football trading cards.');

    return tooltip;
  }

  public disabledStartDate(startValue: Date): boolean {
    // Disable past dates & today + 1day startValue
    if (
      startValue.getTime() <
      dayjs()
        .subtract(24 * 60 * 60 * 1000)
        .toDate()
        .getTime()
    ) {
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

  public formatSubmitData(data: any, mode: 'create' | 'edit' = 'create'): any {
    const discounts: any[] = [];
    data.discounts.forEach((v: DiscountLine) => {
      if (v.amount > 0) {
        discounts.push({
          tokenReward: (v.tokenReward || 0) * Math.pow(10, this.tokenCache[v.tokenUid!].decimals),
          tokenSymbol: this.tokenCache[v.tokenUid!].symbol,
          amount: v.amount / 100,
        });
      }
    });
    data.discounts = discounts.sort((a, b) => {
      return a.tokenReward - b.tokenReward;
    });

    // Convert royaltiesFee
    if (data.royaltiesFee > 0) {
      data.royaltiesFee = data.royaltiesFee / 100;
    } else {
      data.royaltiesFee = 0;
    }

    if (
      !data.accessCollections?.length ||
      data.access !== Access.MEMBERS_WITH_NFT_FROM_COLLECTION
    ) {
      delete data.accessCollections;
    }

    if (!data.accessAwards?.length || data.access !== Access.MEMBERS_WITH_BADGE) {
      delete data.accessAwards;
    }

    if (mode === 'edit') {
      delete data.space;
      delete data.type;
      delete data.category;
      if (!this.availableFromControl.touched) {
        delete data.availableFrom;
      }
      delete data.limitedEdition;

      if (this.collectionMinted) {
        delete data.name;
        delete data.description;
        delete data.royaltiesFee;
        delete data.royaltiesSpace;
        delete data.placeholderUrl;
        delete data.bannerUrl;
        delete data.url;
        delete data.twitter;
        delete data.discord;
      }
    }

    delete data.royaltiesSpaceDifferent;
    delete data.unit;
    return data;
  }

  public async create(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }
    await this.auth.sign(this.formatSubmitData({ ...this.collectionForm.value }), (sc, finish) => {
      this.notification
        .processRequest(this.collectionApi.create(sc), 'Created.', finish)
        .subscribe((val: any) => {
          this.router.navigate([ROUTER_UTILS.config.collection.root, val?.uid]);
        });
    });
  }

  public async save(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }
    await this.auth.sign(
      {
        ...this.formatSubmitData({ ...this.collectionForm.value }, 'edit'),
        ...{
          uid: this.collectionId,
        },
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.collectionApi.update(sc), 'Saved.', finish)
          .subscribe((val: any) => {
            this.router.navigate([ROUTER_UTILS.config.collection.root, val?.uid]);
          });
      },
    );
  }

  public trackByValue(index: number, item: any): number {
    return item.value;
  }

  private getDiscountForm(
    tokenReward = '',
    tokenUid = '',
    tokenSymbol = '',
    amount = '',
  ): FormGroup {
    return new FormGroup({
      tokenReward: new FormControl(tokenReward),
      tokenUid: new FormControl(tokenUid),
      tokenSymbol: new FormControl(tokenSymbol),
      amount: new FormControl(amount, [Validators.required]),
    });
  }

  public addDiscount(tokenReward = '', tokenUid = '', tokenSymbol = '', amount = ''): void {
    if (this.discounts.controls.length < MAX_DISCOUNT_COUNT) {
      this.discounts.push(this.getDiscountForm(tokenReward, tokenUid, tokenSymbol, amount));
    }
  }

  public removeDiscount(index: number): void {
    this.discounts.removeAt(index);
  }

  public gForm(f: any, value: string): any {
    return f.get(value);
  }

  public ngOnDestroy(): void {
    this.collectionsSubscription?.unsubscribe();
    this.awardsSubscription?.unsubscribe();
    this.tokensSubscription?.unsubscribe();
  }
}
