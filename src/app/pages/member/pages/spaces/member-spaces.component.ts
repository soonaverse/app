import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { DeviceService } from '@core/services/device';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService } from '@pages/member/services/data.service';
import { HelperService } from '@pages/member/services/helper.service';
import { Space } from '@buildcore/interfaces';
import { ActivatedRoute } from '@angular/router';

@UntilDestroy()
@Component({
  selector: 'wen-member-spaces',
  templateUrl: './member-spaces.component.html',
  styleUrls: ['./member-spaces.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberSpacesComponent implements OnInit {
  public spaceForm: FormGroup;
  public spacesList: Space[] = [];
  public shownSpaces: Space[] = [];
  public isSearchInputFocused = false;

  constructor(
    public data: DataService,
    public helper: HelperService,
    public deviceService: DeviceService,
    private route: ActivatedRoute,
  ) {
    this.spaceForm = new FormGroup({
      space: new FormControl(''),
    });
    this.shownSpaces = this.spacesList;
  }

  ngOnInit(): void {
    this.route.params.subscribe(() => {
      this.spaceForm.controls.space.valueChanges
        .pipe(untilDestroyed(this))
        .subscribe(this.onSearchValueChange.bind(this));

      this.onSearchValueChange();
    });
  }

  public onSearchValueChange(): void {
    const searchValue = this.spaceForm.controls.space.value;
    this.shownSpaces = this.spacesList.filter((space) =>
      (space.name || '').toLowerCase().includes(searchValue.toLowerCase()),
    );
  }

  public trackByUid(index: number, item: any): any {
    return item ? item.uid : index;
  }
}
