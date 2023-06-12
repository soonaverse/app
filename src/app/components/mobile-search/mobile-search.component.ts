import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { ControlValueAccessor, FormControl, NG_VALUE_ACCESSOR } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';

@UntilDestroy()
@Component({
  selector: 'wen-mobile-search',
  templateUrl: './mobile-search.component.html',
  styleUrls: ['./mobile-search.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: MobileSearchComponent,
    },
  ],
})
export class MobileSearchComponent implements OnInit, ControlValueAccessor {
  @Input() isSearchInputFocused = false;
  @Input() value?: string;
  @Input() placeholder = '';

  public onChange: (v: string | undefined) => undefined = () => undefined;
  public searchControl: FormControl = new FormControl('');

  public ngOnInit(): void {
    this.searchControl.valueChanges.pipe(untilDestroyed(this)).subscribe(() => {
      this.onChange(this.searchControl.value);
    });
  }

  public writeValue(value: string): void {
    this.value = value;
  }

  public registerOnChange(fn: (v: string | undefined) => undefined): void {
    this.onChange = fn;
  }

  public registerOnTouched(): void {
    return undefined;
  }
}
