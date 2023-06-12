import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export interface SelectCollectionOption {
  label: string;
  value: string;
  img?: string;
}

export const DEFAULT_COLLECTION: SelectCollectionOption = {
  label: $localize`All Collections`,
  value: 'all',
};

@UntilDestroy()
@Component({
  selector: 'wen-select-collection',
  templateUrl: './select-collection.component.html',
  styleUrls: ['./select-collection.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SelectCollectionComponent,
    },
  ],
})
export class SelectCollectionComponent implements OnInit {
  @Input() size: 'small' | 'large' = 'small';

  @Input()
  set collections(value: SelectCollectionOption[]) {
    this._collections = [DEFAULT_COLLECTION, ...value];
    this.setShownCollections();
  }

  public get collections(): SelectCollectionOption[] {
    return this._collections;
  }

  public onChange: (v: string | undefined) => undefined = () => undefined;
  public disabled = false;
  public collectionControl: FormControl = new FormControl('', Validators.required);
  public searchControl: FormControl = new FormControl('', Validators.required);
  public isSelectOpen = false;
  public isDrawerOpen = false;
  public shownCollections: SelectCollectionOption[] = [];
  private _collections: SelectCollectionOption[] = [];

  constructor(
    private cd: ChangeDetectorRef,
    public previewImageService: PreviewImageService,
    public deviceService: DeviceService,
  ) {}

  public ngOnInit(): void {
    this.collectionControl.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      this.onChange(value);
      this.isSelectOpen = false;
      this.isDrawerOpen = false;
      this.cd.markForCheck();
    });

    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setShownCollections();
      this.cd.markForCheck();
    });
  }

  public registerOnChange(fn: (v: string | undefined) => undefined): void {
    this.onChange = fn;
  }

  public registerOnTouched(): void {
    return undefined;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public writeValue(value: string): void {
    this.collectionControl.setValue(value);
    this.cd.markForCheck();
  }

  public trackByValue(index: number, item: any): number {
    return item.value;
  }

  public onSelectClick(): void {
    this.isSelectOpen = this.deviceService.isDesktop$.getValue();
    this.isDrawerOpen = this.deviceService.isMobile$.getValue();
    this.cd.markForCheck();
  }

  public getCollection(uid: string): SelectCollectionOption | undefined {
    return this.collections.find((collection) => collection.value === uid);
  }

  private setShownCollections(): void {
    this.shownCollections = this.collections.filter((collection) =>
      collection.label.toLowerCase().includes(this.searchControl.value.toLowerCase()),
    );
  }
}
