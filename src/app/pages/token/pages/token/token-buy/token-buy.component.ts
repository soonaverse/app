import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { SpaceApi } from '@api/space.api';
import { TokenApi } from '@api/token.api';
import { AuthService } from '@components/auth/services/auth.service';
import { ShareComponentSize } from '@components/share/share.component';
import { NotificationService } from '@core/services/notification';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { DataService, TokenAction } from '@pages/token/services/data.service';
import { HelperService } from '@pages/token/services/helper.service';
import { Network } from '@build-5/interfaces';
import { combineLatest, of, skip, switchMap } from 'rxjs';

@UntilDestroy()
@Component({
  selector: 'wen-token-buy',
  templateUrl: './token-buy.component.html',
  styleUrls: ['./token-buy.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenBuyComponent implements OnInit, OnDestroy {
  public isBuyTokensVisible = false;
  public isScheduleSaleVisible = false;
  public isCancelSaleVisible = false;
  public isEditTokenVisible = false;
  public isMintOnNetorkVisible = false;

  constructor(
    public data: DataService,
    public helper: HelperService,
    private spaceApi: SpaceApi,
    private auth: AuthService,
    private notification: NotificationService,
    private tokenApi: TokenApi,
    private cd: ChangeDetectorRef,
  ) {}

  public ngOnInit(): void {
    this.data.triggerAction$.pipe(skip(1), untilDestroyed(this)).subscribe((v) => {
      if (v === TokenAction.EDIT) {
        this.reset();
        this.isEditTokenVisible = true;
        this.cd.markForCheck();
      }

      if (v === TokenAction.MINT) {
        this.reset();
        this.isMintOnNetorkVisible = true;
        this.cd.markForCheck();
      }
    });

    combineLatest([this.auth.member$, this.data.token$])
      .pipe(
        switchMap(([member, token]) => {
          if (member && token?.space) {
            return this.spaceApi.isGuardianWithinSpace(token?.space, member?.uid);
          }
          return of(null);
        }),
        untilDestroyed(this),
      )
      .subscribe((isGuardianWithinSpace) => {
        if (isGuardianWithinSpace !== null) {
          this.data.isGuardianWithinSpace$.next(isGuardianWithinSpace);
        }
      });
  }

  public async enableTrading(): Promise<void> {
    if (!this.data.token$.value?.uid) {
      return;
    }

    await this.auth.sign(
      {
        uid: this.data.token$.value.uid,
      },
      (sc, finish) => {
        this.notification
          .processRequest(this.tokenApi.enableTrading(sc), $localize`Trading enabled.`, finish)
          .subscribe(() => {
            // none.
          });
      },
    );
  }

  public get shareSizes(): typeof ShareComponentSize {
    return ShareComponentSize;
  }

  public get networkTypes(): typeof Network {
    return Network;
  }

  public reset(): void {
    this.isBuyTokensVisible = false;
    this.isScheduleSaleVisible = false;
    this.isCancelSaleVisible = false;
    this.isEditTokenVisible = false;
    this.isMintOnNetorkVisible = false;
  }

  public ngOnDestroy(): void {
    this.reset();
  }
}
