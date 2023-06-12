import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';

export enum CollapseType {
  CARD = 'card',
  UNDERLINE = 'underline',
}

@Component({
  selector: 'wen-collapse',
  templateUrl: './collapse.component.html',
  styleUrls: ['./collapse.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollapseComponent {
  @Input() type: CollapseType = CollapseType.CARD;
  @Input() title?: string;
  @Input() isCollapsed = true;
  @Output() wenOnCollapse = new EventEmitter<boolean>();

  constructor(private cd: ChangeDetectorRef) {}

  public change(): void {
    this.isCollapsed = !this.isCollapsed;
    this.wenOnCollapse.emit(this.isCollapsed);
    this.cd.markForCheck();
  }

  public get collapseTypes(): typeof CollapseType {
    return CollapseType;
  }
}
