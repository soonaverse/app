import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AwardApi } from '@api/award.api';
import { CollectionApi } from '@api/collection.api';
import { MemberApi } from '@api/member.api';
import { NftApi } from '@api/nft.api';
import { SpaceApi } from '@api/space.api';
import { AuthService } from '@components/auth/services/auth.service';
import { DeviceService } from '@core/services/device';
import { PreviewImageService } from '@core/services/preview-image';
import { SeoService } from '@core/services/seo';
import { UnitsService } from '@core/services/units';
import { ROUTER_UTILS } from '@core/utils/router.utils';
import { environment } from '@env/environment';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { HelperService } from '@pages/collection/services/helper.service';
import {
  Award,
  COL,
  Collection,
  CollectionType,
  FILE_SIZES,
  GLOBAL_DEBOUNCE_TIME,
  Network,
  RANKING,
  RANKING_TEST,
} from '@soonaverse/interfaces';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BehaviorSubject, first, firstValueFrom, skip, Subscription } from 'rxjs';
import { DataService } from '../../services/data.service';
import { NotificationService } from './../../../../@core/services/notification/notification.service';

@UntilDestroy()
@Component({
  selector: 'wen-collection',
  templateUrl: './collection.page.html',
  styleUrls: ['./collection.page.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CollectionPage implements OnInit, OnDestroy {
  public isAboutCollectionVisible = false;
  public seeMore = false;
  public rankingConfig = environment.production === true ? RANKING : RANKING_TEST;
  public showNfts$ = new BehaviorSubject<boolean>(false);
  private guardiansSubscription$?: Subscription;
  private guardiansRankModeratorSubscription$?: Subscription;
  private subscriptions$: Subscription[] = [];

  constructor(
    public deviceService: DeviceService,
    public data: DataService,
    public helper: HelperService,
    public previewImageService: PreviewImageService,
    public auth: AuthService,
    public unitsService: UnitsService,
    private notification: NotificationService,
    private nzNotification: NzNotificationService,
    private spaceApi: SpaceApi,
    private awardApi: AwardApi,
    private memberApi: MemberApi,
    private collectionApi: CollectionApi,
    private nftApi: NftApi,
    private cd: ChangeDetectorRef,
    private route: ActivatedRoute,
    private router: Router,
    private seo: SeoService,
  ) {}

  public ngOnInit(): void {
    this.deviceService.viewWithSearch$.next(true);
    this.route.params?.pipe(untilDestroyed(this)).subscribe((obj) => {
      const id: string | undefined =
        obj?.[ROUTER_UTILS.config.collection.collection.replace(':', '')];
      if (id) {
        this.listenToCollection(id);
      } else {
        this.notFound();
      }
    });

    this.auth.member$.pipe(untilDestroyed(this)).subscribe(() => {
      // Once we load proposal let's load guardians for the space.
      if (this.guardiansRankModeratorSubscription$) {
        this.guardiansRankModeratorSubscription$.unsubscribe();
      }

      if (this.auth.member$.value?.uid) {
        this.guardiansRankModeratorSubscription$ = this.spaceApi
          .isGuardianWithinSpace(this.rankingConfig.collectionSpace, this.auth.member$.value.uid)
          .pipe(untilDestroyed(this))
          .subscribe((v) => {
            this.data.isGuardianInRankModeratorSpace$.next(v);
          });
      }
    });

    this.data.collection$
      .pipe(skip(1), untilDestroyed(this))
      .subscribe(async (obj: Collection | undefined) => {
        if (!obj) {
          this.notFound();
          return;
        }

        this.seo.setTags('Collection - ' + obj.name, obj.description, obj.bannerUrl);

        // Once we load proposal let's load guardians for the space.
        if (this.guardiansSubscription$) {
          this.guardiansSubscription$.unsubscribe();
        }

        if (this.auth.member$.value?.uid) {
          this.guardiansSubscription$ = this.spaceApi
            .isGuardianWithinSpace(obj.space, this.auth.member$.value.uid)
            .pipe(untilDestroyed(this))
            .subscribe(this.data.isGuardianWithinSpace$);
        }

        // Get badges to show.
        const awards: Award[] = [];
        if (obj.accessAwards?.length) {
          for (const a of obj.accessAwards) {
            const award: Award | undefined = await firstValueFrom(this.awardApi.listen(a));
            if (award) {
              awards.push(award);
            }
          }
        }

        this.data.accessBadges$.next(awards);
        if (obj.accessCollections?.length) {
          this.data.accessCollections$.next(obj.accessCollections);
        }
      });

    this.data.collection$.pipe(skip(1), first()).subscribe(async (p) => {
      if (p) {
        this.subscriptions$.push(
          this.spaceApi.listen(p.space).pipe(untilDestroyed(this)).subscribe(this.data.space$),
        );
        if (p.royaltiesSpace) {
          this.subscriptions$.push(
            this.spaceApi
              .listen(p.royaltiesSpace)
              .pipe(untilDestroyed(this))
              .subscribe(this.data.royaltySpace$),
          );
        }
        if (p.createdBy) {
          this.subscriptions$.push(
            this.memberApi
              .listen(p.createdBy)
              .pipe(untilDestroyed(this))
              .subscribe(this.data.creator$),
          );
        }
      }
    });
    const t = setInterval(() => {
      if (this.data.collection$.value?.uid) {
        this.showNfts$.next(true);
        clearInterval(t);
      }
    }, GLOBAL_DEBOUNCE_TIME);
  }

  public createNft(): void {
    this.router.navigate([
      '/' + ROUTER_UTILS.config.nft.root,
      ROUTER_UTILS.config.nft.newNft,
      { collection: this.data.collectionId },
    ]);
  }

  private notFound(): void {
    this.router.navigate([ROUTER_UTILS.config.errorResponse.notFound]);
  }

  private listenToCollection(id: string): void {
    this.cancelSubscriptions();
    this.data.collectionId = id;
    this.data.loadServiceModuleData(id);
    this.subscriptions$.push(
      this.collectionApi.listen(id)?.pipe(untilDestroyed(this)).subscribe(this.data.collection$),
    );
    this.subscriptions$.push(this.collectionApi.stats(id).subscribe(this.data.collectionStats$));
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  public get collectionTypes(): typeof CollectionType {
    return CollectionType;
  }

  public async approve(): Promise<void> {
    if (!this.data.collection$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.collection$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.collectionApi.approve(sc), 'Approved.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public async reject(): Promise<void> {
    if (!this.data.collection$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.collection$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.collectionApi.reject(sc), 'Rejected.', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public edit(): void {
    if (!this.data.space$.value?.uid) {
      return;
    }

    this.router.navigate([
      ROUTER_UTILS.config.collection.root,
      ROUTER_UTILS.config.collection.edit,
      {
        collectionId: this.data.collection$.value?.uid,
      },
    ]);
  }

  public async vote(direction: -1 | 0 | 1): Promise<void> {
    if (!this.data.collection$?.value?.uid) {
      return;
    }

    await this.auth.sign(
      { collection: COL.COLLECTION, uid: this.data.collection$.value.uid, direction },
      (sc, finish) => {
        this.notification
          .processRequest(this.collectionApi.vote(sc), 'Voted', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public async rank(): Promise<void> {
    if (!this.data.collection$?.value?.uid) {
      return;
    }

    const rankUnparsed: string | null = prompt('Enter your rank!\nEither OK or Cancel.');
    if (!rankUnparsed) {
      return;
    }

    const rank = parseInt(rankUnparsed);
    if (!(rank >= this.rankingConfig.MIN_RANK && rank <= this.rankingConfig.MAX_RANK)) {
      this.nzNotification.error(
        $localize`Rank amount must be between ` +
          this.rankingConfig.MIN_RANK +
          ' -> ' +
          this.rankingConfig.MAX_RANK,
        '',
      );
      return;
    }

    await this.auth.sign(
      { collection: COL.COLLECTION, uid: this.data.collection$.value.uid, rank },
      (sc, finish) => {
        this.notification
          .processRequest(this.collectionApi.rank(sc), 'Ranked', finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public isLoading(arr: any): boolean {
    return arr === undefined;
  }

  public isEmpty(arr: any): boolean {
    return Array.isArray(arr) && arr.length === 0;
  }

  public trackByUid(index: number, item: any): number {
    return item.uid;
  }

  private cancelSubscriptions(): void {
    this.subscriptions$.forEach((s) => {
      s.unsubscribe();
    });

    this.data.reset();
  }

  public ngOnDestroy(): void {
    this.cancelSubscriptions();
    this.guardiansSubscription$?.unsubscribe();
  }

  public get networkTypes(): typeof Network {
    return Network;
  }

  public collapseInfo() {
    this.seeMore = !this.seeMore;
    this.cd.markForCheck();
  }
}
