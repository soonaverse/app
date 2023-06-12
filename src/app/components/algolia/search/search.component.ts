import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  Inject,
  Input,
  OnInit,
  Optional,
} from '@angular/core';
import { FormControl } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { noop } from '@components/algolia/util';
import { TabSection } from '@components/tabs/tabs.component';
import { DeviceService } from '@core/services/device';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FilterService } from '@pages/market/services/filter.service';
import { GLOBAL_DEBOUNCE_TIME } from '@soonaverse/interfaces';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import connectSearchBox, {
  SearchBoxConnectorParams,
  SearchBoxWidgetDescription,
} from 'instantsearch.js/es/connectors/search-box/connectSearchBox';
import { NzSizeLDSType } from 'ng-zorro-antd/core/types';
import { debounceTime, Subject } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-search-box',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.less'],
  // changeDetection: ChangeDetectionStrategy.OnPush
  // eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
  changeDetection: ChangeDetectionStrategy.Default,
})
export class SearchBoxComponent
  extends TypedBaseWidget<SearchBoxWidgetDescription, SearchBoxConnectorParams>
  implements OnInit
{
  @Input() sections?: TabSection[] = [];
  @Input() reset$? = new Subject<void>();
  @Input() searchSize: NzSizeLDSType = 'large';

  public state: SearchBoxWidgetDescription['renderState'] = {
    clear: noop,
    isSearchStalled: false,
    query: '',
    refine: noop,
  };
  public filterControl: FormControl = new FormControl(undefined);
  public selectedSection?: TabSection;
  public isSearchInputFocused = false;

  constructor(
    @Inject(forwardRef(() => NgAisIndex))
    // eslint-disable-next-line new-cap
    @Optional()
    public parentIndex: NgAisIndex,
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchInstance: NgAisInstantSearch,
    public deviceService: DeviceService,
    private router: Router,
    private filter: FilterService,
  ) {
    super('SearchBox');
  }

  ngOnInit() {
    this.createWidget(connectSearchBox, {
      // instance options
    });

    this.filterControl.valueChanges
      .pipe(debounceTime(GLOBAL_DEBOUNCE_TIME), untilDestroyed(this))
      .subscribe((val) => {
        this.state.refine(val);
        this.filter.search$.next(val);
      });

    this.setSelectedSection();

    this.router.events.pipe(untilDestroyed(this)).subscribe((obj) => {
      if (obj instanceof NavigationEnd) {
        this.setSelectedSection();
      }
    });

    if (this.reset$) {
      this.reset$.pipe(untilDestroyed(this)).subscribe(() => {
        this.filterControl.setValue(undefined);
      });
    }

    super.ngOnInit();

    const currentFilterText = this.filter.search$.value;
    if (currentFilterText) {
      this.filterControl.setValue(currentFilterText);
      this.state.refine(currentFilterText);
    }
  }

  private setSelectedSection() {
    if (this.sections?.length) {
      this.selectedSection = this.sections.find((r: TabSection) =>
        (this.router.url || '').includes(
          (r.route instanceof Array ? r.route : [r.route]).join('/').toLowerCase().substring(3),
        ),
      );
    }
  }
}
