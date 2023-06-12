import {
  ChangeDetectionStrategy,
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
import { noop } from '@components/algolia/util';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import connectSortBy, {
  SortByConnectorParams,
  SortByWidgetDescription,
} from 'instantsearch.js/es/connectors/sort-by/connectSortBy';

@UntilDestroy()
@Component({
  selector: 'wen-sort-by',
  templateUrl: './sort.component.html',
  styleUrls: ['./sort.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SortByComponent
  extends TypedBaseWidget<SortByWidgetDescription, SortByConnectorParams>
  implements OnInit
{
  @Input() items: any[] = [];

  @Input()
  set value(v: string | undefined) {
    this._value = v;
    this.sortControl.setValue(this.value);
  }

  get value(): string | undefined {
    return this._value;
  }

  @Output() wenChange = new EventEmitter<string>();

  public sortControl: FormControl;
  // @ts-ignore
  public state: SortByWidgetDescription['renderState'] = {
    currentRefinement: '',
    hasNoResults: false,
    initialIndex: '',
    options: [],
    refine: noop,
  };
  private _value?: string;

  constructor(
    @Inject(forwardRef(() => NgAisIndex))
    // eslint-disable-next-line new-cap
    @Optional()
    public parentIndex: NgAisIndex,
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchInstance: NgAisInstantSearch,
  ) {
    super('SortBy');
    this.sortControl = new FormControl();

    this.sortControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val: any) => {
      this.state.refine(val);
      this.wenChange.emit(val);
    });
  }

  ngOnInit() {
    this.createWidget(connectSortBy, {
      // instance options
      items: this.items,
    });
    super.ngOnInit();
  }
}
