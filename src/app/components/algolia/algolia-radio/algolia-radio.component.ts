import { Component, forwardRef, Inject, Input, OnInit, Optional } from '@angular/core';
import { FormControl } from '@angular/forms';
import { noop, parseNumberInput } from '@components/algolia/util';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import { connectRefinementList } from 'instantsearch.js/es/connectors';
import {
  RefinementListConnectorParams,
  RefinementListItem,
  RefinementListRenderState,
  RefinementListWidgetDescription,
} from 'instantsearch.js/es/connectors/refinement-list/connectRefinementList';
import { Subject } from 'rxjs';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-algolia-radio',
  templateUrl: './algolia-radio.component.html',
  styleUrls: ['./algolia-radio.component.less'],
})
export class AlgoliaRadioComponent
  extends TypedBaseWidget<RefinementListWidgetDescription, RefinementListConnectorParams>
  implements OnInit
{
  // rendering options
  @Input() public showMoreLabel = $localize`Show more`;
  @Input() public showLessLabel = $localize`Show less`;
  @Input() public searchable?: boolean;
  @Input() public searchPlaceholder = $localize`Search here...`;
  @Input() public reset$ = new Subject<void>();

  // instance options
  @Input() public attribute!: RefinementListConnectorParams['attribute'];
  @Input() public operator: RefinementListConnectorParams['operator'];
  @Input() public limit: RefinementListConnectorParams['limit'];
  @Input() public showMore: RefinementListConnectorParams['showMore'];
  @Input() public showMoreLimit: RefinementListConnectorParams['showMoreLimit'];
  @Input() public sortBy: RefinementListConnectorParams['sortBy'];
  @Input()
  public transformItems?: RefinementListConnectorParams['transformItems'];
  @Input() public showIcon = true;
  public initialItemsList: RefinementListItem[] = [];

  public state: RefinementListRenderState = {
    canRefine: false,
    canToggleShowMore: false,
    createURL: () => '',
    isShowingMore: false,
    items: [],
    refine: noop,
    toggleShowMore: noop,
    searchForItems: noop,
    isFromSearch: false,
    hasExhaustiveItems: false,
    sendEvent: noop,
  };

  public get isHidden() {
    return this.state.items.length === 0 && this.autoHideContainer;
  }

  public formControl = new FormControl();

  constructor(
    @Inject(forwardRef(() => NgAisIndex))
    // eslint-disable-next-line new-cap
    @Optional()
    public parentIndex: NgAisIndex,
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchInstance: NgAisInstantSearch,
  ) {
    super('RefinementList');
  }

  public ngOnInit() {
    this.createWidget(connectRefinementList, {
      showMore: this.showMore,
      limit: parseNumberInput(this.limit),
      showMoreLimit: parseNumberInput(this.showMoreLimit),
      attribute: this.attribute,
      operator: this.operator,
      escapeFacetValues: true,
      sortBy: this.sortBy,
      transformItems: this.transformItems,
    });

    super.ngOnInit();

    this.formControl.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (!this.initialItemsList.length) {
        this.initialItemsList = this.state.items;
      }
      this.state.items
        .filter((item) => item.isRefined)
        .forEach((item) => {
          item.isRefined = false;
          this.state.refine(item.value);
        });
      this.state.refine(value);
    });
  }
}
