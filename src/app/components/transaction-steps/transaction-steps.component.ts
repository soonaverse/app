import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

export interface TransactionStep {
  sequenceNum: number;
  label: string;
}

@Component({
  selector: 'wen-transaction-steps',
  templateUrl: './transaction-steps.component.html',
  styleUrls: ['./transaction-steps.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransactionStepsComponent {
  @Input() steps: TransactionStep[] = [];
  @Input() currentNum = 0;

  public getStepClass(step: TransactionStep): string {
    if (step.sequenceNum === this.steps.length - 1 && step.sequenceNum === this.currentNum) {
      return 'bg-alerts-success dark:bg-alerts-success-dark text-foregrounds-on-primary dark:text-foregrounds-on-primary-dark';
    }
    if (step.sequenceNum < this.currentNum) {
      return 'bg-accent-secondary dark:bg-accent-secondary-dark text-foregrounds-on-primary';
    }
    if (step.sequenceNum === this.currentNum) {
      return 'bg-accent-primary dark:bg-accent-primary-dark text-foregrounds-on-primary';
    }
    if (step.sequenceNum > this.currentNum) {
      return 'text-foregrounds-primary dark:text-foregrounds-primary-dark opacity-50 border border-inputs-border dark:border-inputs-border-dark';
    }
    return '';
  }
}
