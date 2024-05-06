import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TokenApi } from '@api/token.api';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { SeoService } from '@core/services/seo';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/award/services/helper.service';
import { Award, FILE_SIZES, GLOBAL_DEBOUNCE_TIME, Network } from '@buildcore/interfaces';
import { BehaviorSubject, debounceTime, first, skip, Subscription } from 'rxjs';
import { AwardApi } from './../../../../@api/award.api';
import { SpaceApi } from './../../../../@api/space.api';
import { NavigationService } from './../../../../@core/services/navigation/navigation.service';
import { NotificationService } from './../../../../@core/services/notification/notification.service';
import { AuthService } from './../../../../components/auth/services/auth.service';
import { DataService } from './../../services/data.service';

@UntilDestroy()
@Component({
  selector: 'wen-award',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './award.page.html',
  styleUrls: ['./award.page.less'],
})
export class AwardPage implements OnInit, OnDestroy {
  public sections = [
    { route: [ROUTER_UTILS.config.award.overview], label: $localize`Overview` },
    { route: [ROUTER_UTILS.config.award.participants], label: $localize`Participants` },
  ];
  public isSubmitParticipationModalVisible = false;
  public commentControl: FormControl = new FormControl('');
  public isAwardInfoVisible = false;
  public openAwardFund = false;
  private subscriptions$: Subscription[] = [];
  private memberSubscriptions$: Subscription[] = [];

  constructor(
    private auth: AuthService,
    private router: Router,
    private notification: NotificationService,
    private spaceApi: SpaceApi,
    private route: ActivatedRoute,
    private awardApi: AwardApi,
    private tokenApi: TokenApi,
    private seo: SeoService,
    public data: DataService,
    public helper: HelperService,
    public previewImageService: PreviewImageService,
    public nav: NavigationService,
    public deviceService: DeviceService,
  ) {
    // none.
  }

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(false);
    this.route.params?.pipe(untilDestroyed(this)).subscribe((obj) => {
      const id: string | undefined = obj?.[ROUTER_UTILS.config.award.award.replace(':', '')];
      if (id) {
        this.listenToAward(id);
      } else {
        this.notFound();
      }
    });

    // If we're unable to find the space we take the user out as well.
    this.data.award$
      .pipe(skip(1), untilDestroyed(this), debounceTime(GLOBAL_DEBOUNCE_TIME))
      .subscribe((obj: Award | undefined) => {
        if (!obj) {
          this.notFound();
          return;
        }

        // Once we load proposal let's load guardians for the space.
        this.memberSubscriptions$.forEach((s) => {
          s.unsubscribe();
        });
        if (this.auth.member$.value?.uid) {
          this.memberSubscriptions$.push(
            this.spaceApi
              .isGuardianWithinSpace(obj.space, this.auth.member$.value.uid)
              .pipe(untilDestroyed(this))
              .subscribe(this.data.isGuardianWithinSpace$),
          );

          this.memberSubscriptions$.push(
            this.awardApi
              .isMemberParticipant(obj.uid, this.auth.member$.value.uid)
              .pipe(untilDestroyed(this))
              .subscribe(this.data.isParticipantWithinAward$),
          );
        }
      });

    this.data.award$.pipe(skip(1), first()).subscribe((a) => {
      if (a) {
        this.seo.setTags($localize`Award` + ' - ' + a.name, a.description);
        this.subscriptions$.push(
          this.spaceApi.listen(a.space).pipe(untilDestroyed(this)).subscribe(this.data.space$),
        );
        this.subscriptions$.push(
          this.tokenApi
            .listen(a.badge.tokenUid!)
            .pipe(untilDestroyed(this))
            .subscribe(this.data.token$),
        );
      }
    });
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public get networkTypes(): typeof Network {
    return Network;
  }

  public get isLoggedIn$(): BehaviorSubject<boolean> {
    return this.auth.isLoggedIn$;
  }

  public isMintingInProgress(award?: Award | null): boolean {
    return !!(award && award.funded && (!award.aliasId || !award.collectionId));
  }

  private notFound(): void {
    this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
  }

  private listenToAward(id: string): void {
    this.cancelSubscriptions();
    this.subscriptions$.push(
      this.awardApi.listen(id).pipe(untilDestroyed(this)).subscribe(this.data.award$),
    );
    this.subscriptions$.push(
      this.awardApi.listenOwners(id).pipe(untilDestroyed(this)).subscribe(this.data.owners$),
    );
  }

  public showParticipateModal(): void {
    this.isSubmitParticipationModalVisible = true;
  }

  public handleParticipateCancel(): void {
    this.isSubmitParticipationModalVisible = false;
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }

  public async approve(): Promise<void> {
    if (!this.data.award$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.award$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.awardApi.approve(sc), 'Approved.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public async reject(): Promise<void> {
    if (!this.data.award$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.award$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.awardApi.reject(sc), 'Rejected.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public async participate(): Promise<void> {
    this.isSubmitParticipationModalVisible = false;
    if (!this.data.award$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.award$.value.uid,
        comment: this.commentControl.value || undefined,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.awardApi.participate(sc), 'Participated.', finish)
          .subscribe(() => {
            // Let's reset form field back to empty.
            this.commentControl.setValue('');
          });
      },
    );
  }

  public getExplorerUrl(award?: Award | null): string {
    if (award?.network === Network.RMS) {
      return 'https://explorer.shimmer.network/testnet/block/' + award.collectionBlockId;
    } else if (award?.network === Network.IOTA) {
      return 'https://explorer.iota.org/mainnet/block/' + award.collectionBlockId;
    } else if (award?.network === Network.SMR) {
      return 'https://explorer.shimmer.network/shimmer/block/' + award.collectionBlockId;
    } else if (award?.network === Network.ATOI) {
      return 'https://explorer.iota.org/devnet/search/' + award.collectionBlockId;
    } else {
      return '';
    }
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
    this.data.resetSubjects();
    this.memberSubscriptions$.forEach((s) => {
      s.unsubscribe();
    });
  }
}
