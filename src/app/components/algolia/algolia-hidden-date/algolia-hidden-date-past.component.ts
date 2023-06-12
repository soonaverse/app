import { Component, forwardRef, Inject, Input, OnInit, Optional } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import connectRange, {
  RangeConnectorParams,
  RangeWidgetDescription,
} from 'instantsearch.js/es/connectors/range/connectRange';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-algolia-hidden-date-past',
  templateUrl: './algolia-hidden-date-past.component.html',
  styleUrls: ['./algolia-hidden-date-past.component.less'],
})
export class AlgoliaHiddenDatePastComponent
  extends TypedBaseWidget<RangeWidgetDescription, RangeConnectorParams>
  implements OnInit
{
  @Input() attribute = 'availableFrom';
  public state?: RangeWidgetDescription['renderState']; // Rendering options
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
    this.state?.refine([0, Date.now()] as [number, number]);
  }
}
