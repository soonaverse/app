import { Component, forwardRef, Inject, Input, OnInit, Optional } from '@angular/core';
import { FormControl } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { NgAisIndex, NgAisInstantSearch, TypedBaseWidget } from 'angular-instantsearch';
import connectToggleRefinement, {
  ToggleRefinementConnectorParams,
  ToggleRefinementWidgetDescription,
} from 'instantsearch.js/es/connectors/toggle-refinement/connectToggleRefinement';
import { Subject } from 'rxjs';

@UntilDestroy()
// eslint-disable-next-line @angular-eslint/prefer-on-push-component-change-detection
@Component({
  selector: 'wen-algolia-toggle',
  templateUrl: './algolia-toggle.component.html',
  styleUrls: ['./algolia-toggle.component.less'],
})
export class AlgoliaToggleComponent
  extends TypedBaseWidget<ToggleRefinementWidgetDescription, ToggleRefinementConnectorParams>
  implements OnInit
{
  @Input() label = '';

  @Input()
  set on(value: boolean) {
    this._on = value || false;
    this.formControl.setValue(this.on);
    this.state?.refine({ isRefined: !this.on });
  }

  get on(): boolean {
    return this._on;
  }

  @Input() reset$ = new Subject<void>();
  @Input() public attribute!: ToggleRefinementConnectorParams['attribute'];

  public state?: ToggleRefinementWidgetDescription['renderState']; // Rendering options
  public formControl: FormControl = new FormControl(this.on);
  private _on = false;

  constructor(
    @Inject(forwardRef(() => NgAisIndex))
    // eslint-disable-next-line new-cap
    @Optional()
    public parentIndex: NgAisIndex,
    @Inject(forwardRef(() => NgAisInstantSearch))
    public instantSearchInstance: NgAisInstantSearch,
  ) {
    super('ToggleRefinement');
  }

  public ngOnInit(): void {
    this.createWidget(connectToggleRefinement, {
      attribute: this.attribute,
    });
    super.ngOnInit();

    this.formControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val: boolean) => {
      this.on = val;
    });
  }
}
