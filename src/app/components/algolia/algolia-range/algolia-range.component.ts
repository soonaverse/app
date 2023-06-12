import {
  Component,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import connectRange, {
  RangeConnectorParams,
  RangeWidgetDescription,
} from 'instantsearch.js/es/connectors/range/connectRange';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-algolia-range',
  templateUrl: './algolia-range.component.html',
  styleUrls: ['./algolia-range.component.less'],
})
export class AlgoliaRangeComponent
  extends TypedBaseWidget<RangeWidgetDescription, RangeConnectorParams>
  implements OnInit
{
  @Input() reset$ = new Subject<void>();
  @Input() attribute = 'price';

  @Input()
  set value(v: string | undefined) {
    this._value = v;
  }

  get value(): string | undefined {
    return this._value;
  }

  @Output() wenChange = new EventEmitter<string>();

  public state?: RangeWidgetDescription['renderState']; // Rendering options
  public formControl = new FormControl([this.state?.range.min, this.state?.range.max]);
  public minControl = new FormControl(this.state?.range?.min);
  public maxControl = new FormControl(this.state?.range?.max);
  private _value?: string;

  constructor(
    @Inject(forwardRef(() => NgAisIndex))
    // eslint-disable-next-line new-cap
    @Optional()
    public parentIndex: NgAisIndex,
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchInstance: NgAisInstantSearch,
  ) {
    super('RangeSlider');
  }

  public ngOnInit(): void {
    this.createWidget(connectRange, {
      // instance options
      attribute: this.attribute,
    });
    super.ngOnInit();

    // Disable control.
    this.minControl.disable();
    this.maxControl.disable();

    // TODO: this needs to be refactored and written some other way
    const interval = setInterval(() => {
      if (this.state?.range?.max) {
        this.minControl.setValue((this.state?.range?.min || 0) / 1000 / 1000);
        this.maxControl.setValue((this.state?.range?.max || 0) / 1000 / 1000);
        clearInterval(interval);
      }
    }, 100);

    this.formControl.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((val: (number | undefined)[] | null) => {
        if (!val || val.length < 2) return;
        this.minControl.setValue((val[0] || 0) / 1000 / 1000);
        this.maxControl.setValue((val[1] || 0) / 1000 / 1000);
        this.state?.refine(val as [number, number]);
        this.wenChange.emit(`${val[0]}:${val[1]}`);
      });

    this.minControl.valueChanges
      .pipe(
        map((val: number | null | undefined) => String(val || 0)),
        filter(
          (val: string) =>
            Number(val) * 1000 * 1000 !== this.formControl?.value?.[0] && !isNaN(Number(val)),
        ),
        untilDestroyed(this),
      )
      .subscribe((val: string) => {
        this.formControl.setValue([Number(val) * 1000 * 1000, this.formControl?.value?.[1]]);
      });

    this.maxControl.valueChanges
      .pipe(
        map((val: number | null | undefined) => String(val || 0)),
        filter(
          (val: string) =>
            Number(val) * 1000 * 1000 !== this.formControl?.value?.[1] && !isNaN(Number(val)),
        ),
        untilDestroyed(this),
      )
      .subscribe((val: string) => {
        this.formControl.setValue([this.formControl?.value?.[0], Number(val) * 1000 * 1000]);
      });

    this.reset$.pipe(untilDestroyed(this)).subscribe(() => {
      this.minControl.setValue((this.state?.range?.min || 0) / 1000 / 1000);
      this.maxControl.setValue((this.state?.range?.max || 0) / 1000 / 1000);
    });
  }
}
