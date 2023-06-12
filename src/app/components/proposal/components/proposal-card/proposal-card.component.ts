import { ChangeDetectionStrategy, Component, Input, OnChanges, OnDestroy } from '@angular/core';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { getProposalDoughnutColors } from '@core/utils/colors.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Proposal, ProposalAnswer, Space } from '@build-5/interfaces';
import { ChartConfiguration, ChartType } from 'chart.js';
import bigDecimal from 'js-big-decimal';
import { BehaviorSubject, Subscription } from 'rxjs';
import { SpaceApi } from './../../../../@api/space.api';
import { ROUTER_UTILS } from './../../../../@core/utils/router.utils';

export interface ProposalAnswerResultItem {
  answer: ProposalAnswer;
  result: number;
}

@UntilDestroy()
@Component({
  selector: 'wen-proposal-card',
  templateUrl: './proposal-card.component.html',
  styleUrls: ['./proposal-card.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProposalCardComponent implements OnChanges, OnDestroy {
  @Input()
  set proposal(value: Proposal | undefined) {
    this._proposal = value;
    if (this.proposal?.questions[0].answers && this.proposal?.questions[0].answers.length > 2) {
      this.sortedAnswerResults = this.proposal?.questions[0].answers
        .map((a) => ({ answer: a, result: this.proposal?.results?.answers[a.value] || 0 }))
        .sort((a, b) => b.result - a.result);
      if (this.sortedAnswerResults[0].result === 0) {
        this.sortedAnswerResults = this.sortedAnswerResults.map((r) => ({ ...r, result: 1 }));
      }
      this.answersSum = this.sortedAnswerResults.reduce((a, b) => a + b.result, 0);
      this.doughnutChartData = {
        datasets: [
          {
            label: 'Dataset 1',
            data: this.sortedAnswerResults.map((a) => a.result),
            backgroundColor: getProposalDoughnutColors(this.sortedAnswerResults.length),
          },
        ],
      };
    }
  }

  get proposal(): Proposal | undefined {
    return this._proposal;
  }

  @Input() fullWidth?: boolean;

  public space$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public path = ROUTER_UTILS.config.proposal.root;
  public sortedAnswerResults: ProposalAnswerResultItem[] = [];
  public answersSum = 0;
  public doughnutChartType: ChartType = 'doughnut';
  public doughnutChartData?: ChartConfiguration['data'] = {
    datasets: [],
  };
  public doughnutChartOptions?: any = {
    events: [],
    plugins: {
      legend: {
        display: false,
      },
    },
    elements: {
      arc: {
        borderWidth: 0,
      },
    },
    cutout: '75%',
  };

  private _proposal?: Proposal;
  private subscriptions$: Subscription[] = [];

  constructor(
    private spaceApi: SpaceApi,
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
  ) {}

  public getProgressForTwo(a: ProposalAnswer[]): number[] {
    const answerOne =
      ((this.proposal?.results?.answers?.[a[0].value] || 0) /
        (this.proposal?.results?.total || 1)) *
      100;
    const answerTwo =
      ((this.proposal?.results?.answers?.[a[1].value] || 0) /
        (this.proposal?.results?.total || 1)) *
      100;
    return [answerOne > 0 ? 100 - answerTwo : 0, answerTwo];
  }

  public castAsStringArray(item: unknown): string[] {
    return item as string[];
  }

  public getPercentage(result: number): string {
    return bigDecimal.divide(bigDecimal.multiply(result, 100), this.answersSum || 1, 0).toString();
  }

  public ngOnChanges(): void {
    if (this.proposal?.space) {
      this.subscriptions$.push(
        this.spaceApi.listen(this.proposal.space).pipe(untilDestroyed(this)).subscribe(this.space$),
      );
    }
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
