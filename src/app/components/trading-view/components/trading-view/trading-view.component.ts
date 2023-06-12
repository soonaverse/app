import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TokenPurchaseApi } from '@api/token_purchase.api';
import { ThemeList, ThemeService } from '@core/services/theme';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TokenPurchase, TokenStatus } from '@build-5/interfaces';
import dayjs from 'dayjs';
import {
  CandlestickData,
  CrosshairMode,
  GridOptions,
  HistogramData,
  IChartApi,
  ISeriesApi,
  LayoutOptions,
  LineData,
  SingleValueData,
  TimeScaleOptions,
  UTCTimestamp,
  VisiblePriceScaleOptions,
  createChart,
} from 'lightweight-charts';
import { BehaviorSubject, Subscription } from 'rxjs';

export enum TRADING_VIEW_INTERVALS {
  '5m' = '5m',
  '1h' = '1h',
  '4h' = '4h',
  '1d' = '1d',
  '1w' = '1w',
}

@UntilDestroy()
@Component({
  selector: 'wen-trading-view',
  templateUrl: './trading-view.component.html',
  styleUrls: ['./trading-view.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TradingViewComponent implements OnInit, AfterViewInit {
  @Input()
  public set tokenId(value: string | undefined) {
    this._tokenId = value;
    this.refreshData();
  }

  @Input() public status?: TokenStatus;

  @Input()
  public set width(value: number) {
    this._width = value;
    this.resize();
  }

  @Input()
  public set interval(value: TRADING_VIEW_INTERVALS) {
    this._interval = value;
    // Subscription for data already initiated.
    if (this.purchasesSubs$) {
      this.drawData();
    }
  }

  public get data(): TokenPurchase[] {
    return this._data;
  }

  @ViewChild('tradingView') tradingViewEleRef?: ElementRef<HTMLElement>;
  private chart?: IChartApi;
  private candlestickSeries?: ISeriesApi<'Candlestick'>;
  private volumeSeries?: ISeriesApi<'Histogram'>;
  private baselineSeries?: ISeriesApi<'Baseline'>;
  private lineSeries?: ISeriesApi<'Line'>;
  private _data: TokenPurchase[] = [];
  private _interval: TRADING_VIEW_INTERVALS = TRADING_VIEW_INTERVALS['1h'];
  private _tokenId?: string;
  private _width = 600;
  public listenToPurchases$: BehaviorSubject<TokenPurchase[]> = new BehaviorSubject<
    TokenPurchase[]
  >([]);
  private purchasesSubs$?: Subscription;
  private timeLimit = 3600;
  private defaultHeight = 400;

  constructor(public tokenPurchaseApi: TokenPurchaseApi, private themeService: ThemeService) {
    // none.
  }

  public ngOnInit(): void {
    this.refreshData();
    this.listenToPurchases$.subscribe(() => {
      this.drawData();
    });

    this.themeService.theme$.pipe(untilDestroyed(this)).subscribe(() => {
      this.chart?.applyOptions({
        layout: this.getLayoutColours(),
        grid: this.getGridColours(),
        rightPriceScale: this.getPriceScaleColour(),
        timeScale: this.getTimeScaleColour(),
      });
    });
  }

  public ngAfterViewInit(): void {
    // Great examples: https://www.tradingview.com/lightweight-charts/
    if (this.tradingViewEleRef) {
      this.chart = createChart(this.tradingViewEleRef.nativeElement, {
        width: this.calcWidth(),
        height: this.defaultHeight,
        crosshair: {
          mode: CrosshairMode.Normal,
        },
        layout: this.getLayoutColours(),
        grid: this.getGridColours(),
        rightPriceScale: this.getPriceScaleColour(),
        timeScale: this.getTimeScaleColour(),
      });
      this.candlestickSeries = this.chart.addCandlestickSeries({
        wickVisible: true,
        borderVisible: true,
        upColor: '#28B16F',
        borderUpColor: '#28B16F',
        wickUpColor: '#28B16F',
        downColor: '#E14F4F',
        borderDownColor: '#E14F4F',
        wickDownColor: '#E14F4F',
      });
      this.volumeSeries = this.chart.addHistogramSeries({
        color: '#28B16F',
        priceFormat: {
          type: 'volume',
        },
        priceScaleId: '',
        scaleMargins: {
          top: 0.8,
          bottom: 0,
        },
      });
      this.baselineSeries = this.chart.addBaselineSeries({
        lineWidth: 1,
      });
      this.lineSeries = this.chart.addLineSeries({
        color: '#020409',
        lineWidth: 1,
      });
    }
  }

  private getLayoutColours(): LayoutOptions {
    return <LayoutOptions>{
      backgroundColor: this.themeService.theme$.value === ThemeList.Dark ? '#141412' : '#ffffff',
      textColor: this.themeService.theme$.value === ThemeList.Dark ? '#D5D3CC' : '#333333',
      fontSize: 14,
      fontFamily: `'Poppins', sans-serif`,
    };
  }

  private getGridColours(): GridOptions {
    return <GridOptions>{
      vertLines: {
        color: this.themeService.theme$.value === ThemeList.Dark ? '#272520' : '#F0EEE6',
      },
      horzLines: {
        color: this.themeService.theme$.value === ThemeList.Dark ? '#272520' : '#F0EEE6',
      },
    };
  }

  private getPriceScaleColour(): VisiblePriceScaleOptions {
    return <VisiblePriceScaleOptions>{
      borderColor: this.themeService.theme$.value === ThemeList.Dark ? '#272520' : '#F0EEE6',
    };
  }

  private getTimeScaleColour(): TimeScaleOptions {
    return <TimeScaleOptions>{
      borderColor: this.themeService.theme$.value === ThemeList.Dark ? '#272520' : '#F0EEE6',
    };
  }

  private resize(): void {
    this.chart?.resize(this.calcWidth(), this.defaultHeight);
  }

  private calcWidth(): number {
    return this._width;
  }

  private refreshData(): void {
    if (!this._tokenId || !this.status) return;
    this.purchasesSubs$?.unsubscribe();
    this.purchasesSubs$ = this.tokenPurchaseApi
      .listenToPurchases(this._tokenId)
      .pipe(untilDestroyed(this))
      .subscribe(this.listenToPurchases$);
  }

  private drawData(): void {
    if (!this.listenToPurchases$.value?.length) {
      return;
    }

    const chartData: CandlestickData[] = [];
    const volumeData: HistogramData[] = [];
    const baselineData: SingleValueData[] = [];
    const lineData: LineData[] = [];

    this.setTimeLimit();
    const sortedList = this.listenToPurchases$.value.sort((a, b) => {
      return a.createdOn!.seconds - b.createdOn!.seconds;
    });

    let start = dayjs(sortedList[0].createdOn?.toDate()).hour(0).minute(0).second(0).millisecond(0);
    // We only go 1 days back
    if (this._interval === TRADING_VIEW_INTERVALS['5m']) {
      start = dayjs().subtract(1, 'day').hour(0).minute(0).second(0).millisecond(0);
    }

    while (start.isBefore(dayjs())) {
      const next = start.add(this.timeLimit, 'second');
      const recordsWithinTime: TokenPurchase[] = this.listenToPurchases$.value.filter((o) => {
        return (
          dayjs(o.createdOn!.toDate()).isAfter(start) &&
          dayjs(o.createdOn!.toDate()).isSameOrBefore(next)
        );
      });

      if (recordsWithinTime.length) {
        const max = Math.max(...recordsWithinTime.map((o) => o.price));
        const min = Math.min(...recordsWithinTime.map((o) => o.price));
        const sum =
          recordsWithinTime.map((o) => o.count).reduce((partialSum, a) => partialSum + a, 0) /
          1000 /
          1000;
        chartData.push({
          time: next.unix() as UTCTimestamp,
          open: recordsWithinTime[0].price || 0,
          high: max || 0,
          low: min || 0,
          close: recordsWithinTime[recordsWithinTime.length - 1].price || 0,
        });

        const green = 'rgba(87, 174, 117, 0.6)';
        const red = 'rgba(208, 89, 84, 0.6)';
        volumeData.push({
          time: next.unix() as UTCTimestamp,
          value: sum,
          color:
            // Not sure this is correct.
            // chartData[chartData.length - 2] &&
            // in a given time frame, if the closing price is greater than the opening price,
            chartData[chartData.length - 1].close > chartData[chartData.length - 1].open
              ? // but the candle's closing price is lesser than the previous candle's closing price, you will get a green candlestick & a red volume bar.
                // && chartData[chartData.length - 1].close < chartData[chartData.length - 2].close
                red
              : green,
        });
      }

      start = next;
    }

    if (this.candlestickSeries && chartData.length > 0) {
      this.candlestickSeries!.setData(chartData);
      this.volumeSeries!.setData(volumeData);
      this.baselineSeries!.setData(baselineData);
      this.lineSeries!.setData(lineData);

      let pastDays = 7;
      if (
        this._interval === TRADING_VIEW_INTERVALS['1d'] ||
        this._interval === TRADING_VIEW_INTERVALS['1w']
      ) {
        pastDays = 4 * 7 * 3;
      } else if (this._interval === TRADING_VIEW_INTERVALS['5m']) {
        pastDays = 1;
      }
      this.chart?.timeScale().setVisibleRange({
        from: dayjs().subtract(pastDays, 'day').unix() as UTCTimestamp,
        to: dayjs().unix() as UTCTimestamp,
      });
    }
  }

  private setTimeLimit(): void {
    const time = parseInt(this._interval.split('')[0], 10);
    const unit = this._interval.split('')[1];

    switch (unit) {
      case 'm':
        this.timeLimit = 60 * time;
        break;
      case 'h':
        this.timeLimit = 3600 * time;
        break;
      case 'd':
        this.timeLimit = 3600 * 24 * time;
        break;
      case 'w':
        this.timeLimit = 3600 * 24 * 7 * time;
        break;
    }
  }
}
