import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  forwardRef,
  Inject,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import connectClearRefinements, {
  ClearRefinementsConnectorParams,
  ClearRefinementsWidgetDescription,
} from 'instantsearch.js/es/connectors/clear-refinements/connectClearRefinements';

@Component({
  selector: 'wen-algolia-clear',
  templateUrl: './algolia-clear.component.html',
  styleUrls: ['./algolia-clear.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlgoliaClearComponent
  extends TypedBaseWidget<ClearRefinementsWidgetDescription, ClearRefinementsConnectorParams>
  implements OnInit
{
  @Output() wenOnClear = new EventEmitter<void>();

  public state?: ClearRefinementsWidgetDescription['renderState'];

  constructor(
    @Inject(forwardRef(() => NgAisIndex))
    // eslint-disable-next-line new-cap
    @Optional()
    public parentIndex: NgAisIndex,
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchInstance: NgAisInstantSearch,
  ) {
    super('ClearRefinements');
  }

  public ngOnInit(): void {
    this.createWidget(connectClearRefinements, {});
    super.ngOnInit();
  }

  public clear(): void {
    this.state?.refine();
    this.wenOnClear.emit();
  }
}
