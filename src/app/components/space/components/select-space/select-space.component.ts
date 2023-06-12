import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR, Validators } from '@angular/forms';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

export interface SelectSpaceOption {
  label: string;
  value: string;
  img?: string;
}

export const DEFAULT_SPACE: SelectSpaceOption = {
  label: $localize`All Spaces`,
  value: 'all',
};

@UntilDestroy()
@Component({
  selector: 'wen-select-space',
  templateUrl: './select-space.component.html',
  styleUrls: ['./select-space.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: SelectSpaceComponent,
    },
  ],
})
export class SelectSpaceComponent implements OnInit, ControlValueAccessor {
  @Input() size: 'small' | 'large' = 'small';
  @Input() includeDefaultSpace = true;

  @Input()
  set spaces(value: SelectSpaceOption[]) {
    if (this.includeDefaultSpace) {
      this._spaces = [DEFAULT_SPACE, ...value];
    } else {
      this._spaces = [...value];
    }
    this.setShownSpaces();
  }

  public get spaces(): SelectSpaceOption[] {
    return this._spaces;
  }

  public onChange: (v: string | undefined) => undefined = () => undefined;
  public disabled = false;
  public spaceControl: FormControl = new FormControl('', Validators.required);
  public searchControl: FormControl = new FormControl('', Validators.required);
  public isSelectOpen = false;
  public isDrawerOpen = false;
  public shownSpaces: SelectSpaceOption[] = [];
  private _spaces: SelectSpaceOption[] = [];

  constructor(
    private cd: ChangeDetectorRef,
    public previewImageService: PreviewImageService,
    public deviceService: DeviceService,
  ) {}

  public ngOnInit(): void {
    this.spaceControl.valueChanges.pipe(untilDestroyed(this)).subscribe((value: string) => {
      this.onChange(value);
      this.isSelectOpen = false;
      this.isDrawerOpen = false;
      this.cd.markForCheck();
    });

    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.setShownSpaces();
      this.cd.markForCheck();
    });
  }

  public registerOnChange(fn: () => undefined): void {
    this.onChange = fn;
  }

  public registerOnTouched(): void {
    return undefined;
  }

  public setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  public writeValue(value: string): void {
    this.spaceControl.setValue(value);
    this.cd.markForCheck();
  }

  public trackByValue(index: number, item: SelectSpaceOption) {
    return item.value;
  }

  public onSelectClick(): void {
    this.isSelectOpen = this.deviceService.isDesktop$.getValue();
    this.isDrawerOpen = this.deviceService.isMobile$.getValue();
    this.cd.markForCheck();
  }

  public getSpace(uid: string): SelectSpaceOption | undefined {
    return this.spaces.find((space) => space.value === uid);
  }

  private setShownSpaces(): void {
    this.shownSpaces = this.spaces.filter((space) =>
      space.label.toLowerCase().includes(this.searchControl.value.toLowerCase()),
    );
  }
}
