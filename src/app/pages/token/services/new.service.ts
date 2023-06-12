import { Injectable } from '@angular/core';
import { FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { FileApi } from '@api/file.api';
import { AuthService } from '@components/auth/services/auth.service';
import { SelectSpaceOption } from '@components/space/components/select-space/select-space.component';
import { getUrlValidator } from '@core/utils/form-validation.utils';
import {
  DEFAULT_NETWORK,
  MAX_IOTA_AMOUNT,
  MAX_TOTAL_TOKEN_SUPPLY,
  MIN_TOTAL_TOKEN_SUPPLY,
  NETWORK_DETAIL,
  Space,
  TokenAllocation,
  TokenDistributionType,
} from '@soonaverse/interfaces';
import dayjs from 'dayjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzUploadChangeParam, NzUploadXHRArgs } from 'ng-zorro-antd/upload';
import { BehaviorSubject, Subscription, of } from 'rxjs';

export const MAX_ALLOCATIONS_COUNT = 100;
export const MAX_DESCRIPTIONS_COUNT = 5;
export const MAX_LINKS_COUNT = 20;

@Injectable({
  providedIn: 'any',
})
export class NewService {
  public distributionOptions = [
    { label: $localize`Fixed price`, value: TokenDistributionType.FIXED },
  ];
  public maxAllocationsCount = MAX_ALLOCATIONS_COUNT;
  public maxLinksCount = MAX_LINKS_COUNT;

  public nameControl: FormControl = new FormControl('', Validators.required);
  public symbolControl: FormControl = new FormControl('', [
    Validators.required,
    Validators.pattern(/^[A-Z]+$/),
    Validators.minLength(2),
    Validators.maxLength(5),
  ]);
  public priceControl: FormControl = new FormControl('1', [
    Validators.required,
    Validators.min(0),
    Validators.max(MAX_IOTA_AMOUNT / NETWORK_DETAIL[DEFAULT_NETWORK].divideBy),
  ]);
  public totalSupplyControl: FormControl = new FormControl('', [
    Validators.required,
    Validators.min(MIN_TOTAL_TOKEN_SUPPLY),
    Validators.max(MAX_TOTAL_TOKEN_SUPPLY),
  ]);
  public spaceControl: FormControl = new FormControl('', Validators.required);
  public iconControl: FormControl = new FormControl('', Validators.required);
  public titleControl: FormControl = new FormControl('', Validators.required);
  public descriptionControl: FormControl = new FormControl('', Validators.required);
  public shortTitleControl: FormControl = new FormControl('');
  public shortDescriptionControl: FormControl = new FormControl('');
  public decimalsControl: FormControl = new FormControl(6, [Validators.min(0), Validators.max(20)]);
  public distributionControl: FormControl = new FormControl(
    TokenDistributionType.FIXED,
    Validators.required,
  );
  public introductionaryControl: FormControl = new FormControl('', Validators.required);
  public termsAndConditionsLinkControl: FormControl = new FormControl('', [
    Validators.required,
    getUrlValidator(),
  ]);

  public allocations: FormArray;
  public links: FormArray;
  public tokenForm: FormGroup;
  public spaces$: BehaviorSubject<Space[]> = new BehaviorSubject<Space[]>([]);

  constructor(
    private nzNotification: NzNotificationService,
    private fileApi: FileApi,
    private auth: AuthService,
  ) {
    this.allocations = new FormArray([] as FormGroup[]);
    this.links = new FormArray([] as FormGroup[]);

    this.tokenForm = new FormGroup({
      name: this.nameControl,
      symbol: this.symbolControl,
      price: this.priceControl,
      totalSupply: this.totalSupplyControl,
      space: this.spaceControl,
      icon: this.iconControl,
      distribution: this.distributionControl,
      introductionary: this.introductionaryControl,
      title: this.titleControl,
      description: this.descriptionControl,
      allocations: this.allocations,
      links: this.links,
      termsAndConditionsLink: this.termsAndConditionsLinkControl,
      shortDescription: this.shortDescriptionControl,
      shortTitle: this.shortTitleControl,
      decimals: this.decimalsControl,
    });

    this.addAllocation();
    this.addLink();
  }

  private getAllocationForm(title = '', percentage = '', isPublicSale = false): FormGroup {
    return new FormGroup({
      title: new FormControl(title, Validators.required),
      percentage: new FormControl(percentage, [
        Validators.required,
        Validators.min(0.01),
        Validators.max(100),
      ]),
      isPublicSale: new FormControl(isPublicSale),
    });
  }

  public addAllocation(title = '', percentage = '', isPublicSale = false): void {
    if (this.allocations.controls.length < MAX_ALLOCATIONS_COUNT) {
      if (!percentage) {
        percentage = String(
          100 -
            this.allocations.value.reduce(
              (acc: number, r: TokenAllocation) => acc + Number(r.percentage),
              0,
            ),
        );
      }
      this.allocations.push(this.getAllocationForm(title, percentage, isPublicSale));
    }
  }

  public removeAllocation(index: number): void {
    this.allocations.removeAt(index);
  }

  private getLinkForm(url = ''): FormGroup {
    return new FormGroup({
      url: new FormControl(url, [Validators.required, getUrlValidator()]),
    });
  }

  public addLink(url = ''): void {
    if (this.links.controls.length < MAX_LINKS_COUNT) {
      this.links.push(this.getLinkForm(url));
    }
  }

  public removeLink(index: number): void {
    this.links.removeAt(index);
  }

  public gForm(f: any, value: string): any {
    return f.get(value);
  }

  public disabledStartDate(startValue: Date): boolean {
    // Disable past dates & today + 1day startValue
    if (startValue.getTime() < dayjs().toDate().getTime()) {
      return true;
    }

    return false;
  }

  public getSpaceListOptions(list?: Space[] | null): SelectSpaceOption[] {
    return (list || [])
      .filter((o) => {
        // Commented because it broke select-space
        // return !!(o.validatedAddress || {})[DEFAULT_NETWORK];
        return !!(o.validatedAddress || {});
      })
      .map((o) => ({
        label: o.name || o.uid,
        value: o.uid,
        img: o.avatarUrl,
      }));
  }

  public uploadChangeIcon(event: NzUploadChangeParam): void {
    this.uploadChange('token_icon', event);
  }

  public uploadChangeIntroductionary(event: NzUploadChangeParam): void {
    this.uploadChange('token_introductionary', event);
  }

  private uploadChange(
    type: 'token_icon' | 'token_introductionary',
    event: NzUploadChangeParam,
  ): void {
    if (event.type === 'success') {
      if (type === 'token_icon') {
        this.iconControl.setValue(event.file.response);
      } else if (type === 'token_introductionary') {
        this.introductionaryControl.setValue(event.file.response);
      }
    }
  }

  public uploadFile(
    type: 'token_icon' | 'token_introductionary',
    item: NzUploadXHRArgs,
  ): Subscription {
    if (!this.auth.member$.value) {
      const err = $localize`Member seems to log out during the file upload request.`;
      this.nzNotification.error(err, '');
      if (item.onError) {
        item.onError(err, item.file);
      }

      return of().subscribe();
    }

    return this.fileApi.upload(this.auth.member$.value.uid, item);
  }
}
