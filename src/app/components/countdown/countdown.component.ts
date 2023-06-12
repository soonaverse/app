import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import dayjs from 'dayjs';
import { interval } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-countdown',
  templateUrl: './countdown.component.html',
  styleUrls: ['./countdown.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CountdownComponent implements OnInit {
  @Input() wrapperClassName = '';
  @Input() tabClassName = '';
  @Input() title = '';

  @Input()
  set finalDate(d: Date | undefined) {
    this._finalDate = dayjs(d || new Date());
  }

  get finalDate(): Date {
    return (this._finalDate || dayjs(new Date())).toDate();
  }

  @Input() size: 'large' | 'default' | 'small' = 'default';
  @Input() showDate = true;

  private _finalDate?: dayjs.Dayjs;

  constructor(private cd: ChangeDetectorRef) {}

  ngOnInit(): void {
    interval(1000)
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.cd.markForCheck();
      });
  }

  public getCountdownDays(): number {
    if (!this._finalDate) {
      return 0;
    }

    return this._finalDate.diff(dayjs(), 'days');
  }

  public getCountdownHours(): number {
    if (!this._finalDate) {
      return 0;
    }

    let hours = this._finalDate.diff(dayjs(), 'hour');
    const days = Math.floor(hours / 24);
    hours = hours - days * 24;
    return hours;
  }

  public getCountdownMin(): number {
    if (!this._finalDate) {
      return 0;
    }

    let minutes = this._finalDate.diff(dayjs(), 'minute');
    const hours = Math.floor(minutes / 60);
    minutes = minutes - hours * 60;
    return minutes;
  }

  public getCountdownSec(): number {
    if (!this._finalDate) {
      return 0;
    }

    let seconds = this._finalDate.diff(dayjs(), 'seconds');
    const minutes = Math.floor(seconds / 60);
    seconds = seconds - minutes * 60;
    return seconds;
  }
}
