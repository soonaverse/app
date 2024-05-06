import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { AuthService } from '@components/auth/services/auth.service';
import { Award } from '@buildcore/interfaces';
import { PreviewImageService } from '@core/services/preview-image';
import { BehaviorSubject } from 'rxjs';
import { DataService } from './../../services/data.service';

enum FilterOptions {
  PENDING = 'pending',
  ISSUED = 'issued',
}

@Component({
  selector: 'wen-awards',
  templateUrl: './awards.page.html',
  styleUrls: ['./awards.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AwardsPage {
  public selectedListControl: FormControl = new FormControl(FilterOptions.PENDING);

  constructor(
    private auth: AuthService,
    private cd: ChangeDetectorRef,
    public data: DataService,
    public previewImageService: PreviewImageService,
  ) {
    // none.
  }

  public get filterOptions(): typeof FilterOptions {
    return FilterOptions;
  }

  public getList(): BehaviorSubject<Award[] | undefined> {
    if (this.selectedListControl.value === this.filterOptions.ISSUED) {
      return this.data.awardsCompleted$;
    } else {
      return this.data.awardsPending$;
    }
  }

  public handleFilterChange(filter: FilterOptions): void {
    this.selectedListControl.setValue(filter);
    this.cd.markForCheck();
  }

  public get isLoggedIn$(): BehaviorSubject<boolean> {
    return this.auth.isLoggedIn$;
  }

  public trackByUid(index: number, item: any): any {
    return item ? item.uid : index;
  }
}
