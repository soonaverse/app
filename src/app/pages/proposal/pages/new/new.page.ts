import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { SpaceApi } from '@api/space.api';
import { TokenApi } from '@api/token.api';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Award, ProposalStartDateMin, ProposalType, Space, Token } from '@buildcore/interfaces';
import dayjs from 'dayjs';
import { NzDatePickerComponent } from 'ng-zorro-antd/date-picker';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import { BehaviorSubject, filter, firstValueFrom, map, Subscription, switchMap } from 'rxjs';
import { MemberApi } from './../../../../@api/member.api';
import { ProposalApi } from './../../../../@api/proposal.api';
import { NavigationService } from './../../../../@core/services/navigation/navigation.service';
import { NotificationService } from './../../../../@core/services/notification/notification.service';

enum TargetGroup {
  NATIVE = ProposalType.NATIVE,
  MEMBERS = ProposalType.MEMBERS,
  GUARDIANS = -1,
}

@UntilDestroy()
@Component({
  selector: 'wen-new',
  templateUrl: './new.page.html',
  styleUrls: ['./new.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewPage implements OnInit, OnDestroy {
  public spaceControl: FormControl = new FormControl('', Validators.required);
  public nameControl: FormControl = new FormControl('', Validators.required);
  public selectedGroupControl: FormControl = new FormControl(
    TargetGroup.GUARDIANS,
    Validators.required,
  );
  public startControl: FormControl = new FormControl('', Validators.required);
  public endControl: FormControl = new FormControl('', Validators.required);
  public typeControl: FormControl = new FormControl(ProposalType.MEMBERS, Validators.required);
  public votingAwardControl: FormControl = new FormControl([]);
  public additionalInfoControl: FormControl = new FormControl('', Validators.required);
  // Questions / answers.
  public questions: FormArray;
  public proposalForm: FormGroup;
  @ViewChild('endDatePicker') public endDatePicker!: NzDatePickerComponent;
  public spaces$: BehaviorSubject<Space[]> = new BehaviorSubject<Space[]>([]);
  private subscriptions$: Subscription[] = [];
  private subscriptionsAwards$?: Subscription;
  private answersIndex = 0;
  public filteredAwards$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  public token$: BehaviorSubject<Token | undefined> = new BehaviorSubject<Token | undefined>(
    undefined,
  );

  constructor(
    private auth: AuthService,
    private proposalApi: ProposalApi,
    private notification: NotificationService,
    private memberApi: MemberApi,
    private route: ActivatedRoute,
    private router: Router,
    private nzNotification: NzNotificationService,
    private seo: SeoService,
    private spaceApi: SpaceApi,
    private tokenApi: TokenApi,
    public nav: NavigationService,
    public readonly algoliaService: AlgoliaService,
    public deviceService: DeviceService,
    public previewImageService: PreviewImageService,
  ) {
    this.questions = new FormArray([this.getQuestionForm()]);

    this.proposalForm = new FormGroup({
      space: this.spaceControl,
      type: this.typeControl,
      name: this.nameControl,
      group: this.selectedGroupControl,
      start: this.startControl,
      end: this.endControl,
      additionalInfo: this.additionalInfoControl,
      questions: this.questions,
    });
  }

  public ngOnInit(): void {
    if (
      this.nav.getLastUrl() &&
      this.nav.getLastUrl()[1] === ROUTER_UTILS.config.space.root &&
      this.nav.getLastUrl()[2]
    ) {
      this.spaceControl.setValue(this.nav.getLastUrl()[2]);
    }

    this.spaceControl.valueChanges.subscribe(async (s) => {
      if (s) {
        const token = await firstValueFrom(
          this.tokenApi
            .space(s)
            .pipe(map((tokens: Token[] | undefined) => (tokens || [])?.[0] || null)),
        );

        if (token) {
          this.token$.next(token);
        } else {
          this.token$.next(undefined);
        }
      } else {
        this.token$.next(undefined);
      }
    });

    this.seo.setTags(
      $localize`Proposal - New`,
      $localize`Create and vote on proposals that help shape the future of DAOs and the metaverse. Instant 1-click set up. Join today.`,
    );

    this.route.params
      ?.pipe(
        filter((p) => p.space),
        switchMap((p) => this.spaceApi.listen(p.space)),
        filter((space) => !!space),
        untilDestroyed(this),
      )
      .subscribe((space: any) => {
        this.spaceControl.setValue(space?.uid);

        this.seo.setTags(
          $localize`Proposal - New`,
          $localize`Create and vote on proposals that help shape the future of DAOs and the metaverse. Instant 1-click set up. Join today.`,
          space?.bannerUrl,
        );
      });

    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((o) => {
      if (o?.uid) {
        this.subscriptions$.push(this.memberApi.allSpacesAsMember(o.uid).subscribe(this.spaces$));
      }
    });

    this.selectedGroupControl.valueChanges.pipe(untilDestroyed(this)).subscribe((val) => {
      this.typeControl.setValue(
        val === ProposalType.NATIVE ? ProposalType.NATIVE : ProposalType.MEMBERS,
      );
    });
  }

  private getAnswerForm(): FormGroup {
    this.answersIndex++;
    return new FormGroup({
      value: new FormControl(this.answersIndex, [
        Validators.min(0),
        Validators.max(255),
        Validators.required,
      ]),
      text: new FormControl('', Validators.required),
      additionalInfo: new FormControl(''),
    });
  }

  public trackByUid(index: number, item: Award | Space) {
    return item.uid;
  }

  private getQuestionForm(): FormGroup {
    return new FormGroup({
      text: new FormControl('', Validators.required),
      additionalInfo: new FormControl(''),
      answers: new FormArray([this.getAnswerForm(), this.getAnswerForm()]),
    });
  }

  public get targetGroups(): typeof TargetGroup {
    return TargetGroup;
  }

  public gForm(f: any, value: string): any {
    return f.get(value);
  }

  public getAnswers(question: any): any {
    return question.controls.answers.controls;
  }

  public addAnswer(f: any): void {
    f.controls.answers.push(this.getAnswerForm());
  }

  public removeAnswer(f: any, answerIndex: number): void {
    if (f.controls.answers.length > 2) {
      this.answersIndex--;
      f.controls.answers.removeAt(answerIndex);
    }
  }

  public addQuestion(): void {
    this.questions.push(this.getQuestionForm());
  }

  public removeQuestion(questionIndex: number): void {
    if (this.questions.controls.length > 1) {
      this.questions.removeAt(questionIndex);
    }
  }

  public disabledStartDate(startValue: Date): boolean {
    // Disable past dates & today + 1day startValue
    if (startValue.getTime() < Date.now() - 60 * 60 * 1000 * 24) {
      return true;
    }

    if (!startValue || !this.endControl.value) {
      return false;
    }

    return startValue.getTime() > this.endControl.value.getTime();
  }

  public disabledEndDate(endValue: Date): boolean {
    if (endValue.getTime() < Date.now() - 60 * 60 * 1000 * 24) {
      return true;
    }

    if (!endValue || !this.startControl.value) {
      return false;
    }
    return endValue.getTime() <= this.startControl.value.getTime();
  }

  public handleStartOpenChange(open: boolean): void {
    if (!open) {
      this.endDatePicker.open();
    }
  }

  private formatSubmitObj(obj: any) {
    obj.settings = {
      startDate: obj.start,
      endDate: obj.end,
      onlyGuardians: !!(obj.group === TargetGroup.GUARDIANS),
    };

    delete obj.start;
    delete obj.end;
    delete obj.group;
    return obj;
  }

  private validateControls(controls: { [key: string]: AbstractControl }): void {
    Object.values(controls).forEach((control) => {
      if (control.invalid) {
        control.markAsDirty();
        control.updateValueAndValidity({ onlySelf: true });
      }
    });
  }

  private validateForm(): boolean {
    this.proposalForm.updateValueAndValidity();
    if (!this.proposalForm.valid) {
      this.validateControls(this.proposalForm.controls);
      return false;
    }

    return true;
  }

  public get isProd(): boolean {
    return environment.production;
  }

  public async create(): Promise<void> {
    if (!this.validateForm()) {
      return;
    }

    if (dayjs(this.startControl.value).isBefore(dayjs().add(ProposalStartDateMin.value, 'ms'))) {
      this.nzNotification.error(
        '',
        'Start Date must be ' + ProposalStartDateMin.value / 60 / 1000 + ' minutes in future.',
      );
      return;
    }

    await this.auth.sign(this.formatSubmitObj(this.proposalForm.value), (sc, finish) => {
      this.notification
        .processRequest(this.proposalApi.create(sc), 'Created.', finish)
        .subscribe((val: any) => {
          this.router.navigate([ROUTER_UTILS.config.proposal.root, val?.uid]);
        });
    });
  }

  public getAnswerTitle(index: number): string {
    return $localize`Choice` + ` #${index >= 10 ? index : '0' + index}`;
  }

  public getAwardLabel(award: Award): string {
    return (
      award.name +
      ' (' +
      $localize`badge` +
      ': ' +
      award.badge.name +
      ', ' +
      $localize`id` +
      ': ' +
      award.uid.substring(0, 10) +
      ')'
    );
  }

  private cancelSubscriptions(): void {
    this.subscriptionsAwards$?.unsubscribe();
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
  }
}
