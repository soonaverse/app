import {
  AfterViewInit,
  Directive,
  ElementRef,
  EventEmitter,
  OnDestroy,
  Output,
} from '@angular/core';
import { DeviceService } from '@core/services/device';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[visible]',
})
export class VisibleDirective implements AfterViewInit, OnDestroy {
  @Output() public visible: EventEmitter<any> = new EventEmitter();

  private _intersectionObserver?: any;

  constructor(private _element: ElementRef, private deviceService: DeviceService) {}

  public ngAfterViewInit() {
    if (this.deviceService.isBrowser) {
      this._intersectionObserver = new IntersectionObserver((entries) => {
        this.checkForIntersection(entries);
      }, {});
      this._intersectionObserver.observe(<Element>this._element.nativeElement);
    }
  }

  public ngOnDestroy() {
    if (this._intersectionObserver) {
      this._intersectionObserver.disconnect();
    }
  }

  private checkForIntersection = (entries: Array<IntersectionObserverEntry>) => {
    entries.forEach((entry: IntersectionObserverEntry) => {
      const isIntersecting =
        (<any>entry).isIntersecting && entry.target === this._element.nativeElement;

      if (isIntersecting) {
        this.visible.emit();
      }
    });
  };
}
