import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  forwardRef,
  Inject,
  Input,
  OnInit,
  Optional,
  Output,
} from '@angular/core';
import { noop, parseNumberInput } from '@components/algolia/util';
import { CacheService } from '@core/services/cache/cache.service';
import { PreviewImageService } from '@core/services/preview-image';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Access } from '@soonaverse/interfaces';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import { connectRefinementList } from 'instantsearch.js/es/connectors';
import {
  RefinementListConnectorParams,
  RefinementListItem,
  RefinementListRenderState,
  RefinementListWidgetDescription,
} from 'instantsearch.js/es/connectors/refinement-list/connectRefinementList';
import { Subject } from 'rxjs';

export enum AlgoliaCheckboxFilterType {
  DEFAULT = 'Default',
  SALE = 'Sale',
  SPACE = 'Space',
  TOKEN = 'Token',
  COLLECTION = 'Collection',
}

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-algolia-checkbox',
  templateUrl: './algolia-checkbox.component.html',
  styleUrls: ['./algolia-checkbox.component.less'],
})
export class AlgoliaCheckboxComponent
  extends TypedBaseWidget<RefinementListWidgetDescription, RefinementListConnectorParams>
  implements OnInit
{
  // rendering options
  @Input() public showMoreLabel = $localize`Show more`;
  @Input() public showLessLabel = $localize`Show less`;
  @Input() public searchable?: boolean;
  @Input() public searchPlaceholder = $localize`Search here...`;
  @Input() public showSearch = false;
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
  @Input() public filterType: AlgoliaCheckboxFilterType = AlgoliaCheckboxFilterType.DEFAULT;

  @Input()
  set value(v: string[] | undefined) {
    this._value = v;
    this.value?.forEach((value) => {
      const item = this.initialItemsList
        .filter((item) => !item.isRefined)
        .find((item) => item.value === value);
      if (item) {
        this.refine(undefined, item);
      }
      this.cd.markForCheck();
    });
  }

  get value(): string[] | undefined {
    return this._value;
  }

  @Output() wenChange = new EventEmitter<string[]>();
  public initialItemsList: RefinementListItem[] = [];
  public initialValue = '';

  private _value?: string[];

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

  get isHidden() {
    return this.state.items.length === 0 && this.autoHideContainer;
  }

  constructor(
    @Inject(forwardRef(() => NgAisIndex))
    // eslint-disable-next-line new-cap
    @Optional()
    public parentIndex: NgAisIndex,
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchInstance: NgAisInstantSearch,
    public previewImageService: PreviewImageService,
    public cache: CacheService,
    private cd: ChangeDetectorRef,
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
      sortBy: this.sortBy,
      escapeFacetValues: true,
      transformItems: this.transformItems,
    });

    super.ngOnInit();

    this.reset$.pipe(untilDestroyed(this)).subscribe(() => {
      if (this.initialItemsList.length === 0) {
        this.initialItemsList = this.state.items;
      }
      this.initialItemsList.forEach((item) => (item.isRefined = false));
      this.wenChange.emit([]);
      this.cd.markForCheck();
    });
  }

  public get algoliaCheckboxFilterTypes(): typeof AlgoliaCheckboxFilterType {
    return AlgoliaCheckboxFilterType;
  }

  public get collectionAccesses(): typeof Access {
    return Access;
  }

  public refine(event: MouseEvent | undefined, item: RefinementListItem) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.initialItemsList.length) {
      this.initialItemsList = this.state.items;
    }
    if (this.state.canRefine) {
      // update UI directly, it will update the checkbox state
      item.isRefined = !item.isRefined;

      // refine through Algolia API
      this.state.refine(item.value);
      this.wenChange.emit(
        this.initialItemsList.filter((item) => item.isRefined).map((item) => item.value),
      );
    }
  }

  public getCount(item: RefinementListItem): number {
    return this.state.items.find((r) => r.value === item.value)?.count || 0;
  }
}
