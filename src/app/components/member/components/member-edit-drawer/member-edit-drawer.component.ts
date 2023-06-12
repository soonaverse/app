import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { NftApi } from '@api/nft.api';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { AuthService } from '@components/auth/services/auth.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  COL,
  DISCORD_REGEXP,
  FILE_SIZES,
  GITHUB_REGEXP,
  Member,
  Nft,
  TWITTER_REGEXP,
} from '@soonaverse/interfaces';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import { BehaviorSubject, Subscription, first, from } from 'rxjs';
import { MemberApi } from '../../../../@api/member.api';
import { NotificationService } from '../../../../@core/services/notification/notification.service';

const maxAboutCharacters = 160;

@UntilDestroy()
@Component({
  selector: 'wen-member-edit-drawer',
  templateUrl: './member-edit-drawer.component.html',
  styleUrls: ['./member-edit-drawer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemberEditDrawerComponent implements OnInit {
  @Input() isDesktop?: boolean;

  @Output() public wenOnClose = new EventEmitter<void>();
  public filteredNfts$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  public nameControl: FormControl = new FormControl('');
  public aboutControl: FormControl = new FormControl('', Validators.maxLength(maxAboutCharacters));
  public avatarNftControl: FormControl = new FormControl(undefined);
  public discordControl: FormControl = new FormControl('', Validators.pattern(DISCORD_REGEXP));
  public twitterControl: FormControl = new FormControl('', Validators.pattern(TWITTER_REGEXP));
  public githubControl: FormControl = new FormControl('', Validators.pattern(GITHUB_REGEXP));
  public minted = false;
  public maxAboutCharacters = maxAboutCharacters;
  public memberForm: FormGroup;
  public nftCache: {
    [propName: string]: {
      name: string;
      media: string;
    };
  } = {};

  private nftsSubscription?: Subscription;
  constructor(
    private auth: AuthService,
    private memberApi: MemberApi,
    private nftApi: NftApi,
    public readonly algoliaService: AlgoliaService,
    private notification: NotificationService,
  ) {
    this.memberForm = new FormGroup({
      name: this.nameControl,
      about: this.aboutControl,
      avatarNft: this.avatarNftControl,
      discord: this.discordControl,
      twitter: this.twitterControl,
      github: this.githubControl,
    });
  }

  public ngOnInit(): void {
    // Load default values.
    if (this.auth.member$.value) {
      this.setFormValues(this.auth.member$.value);
    }
    this.auth.member$?.pipe(untilDestroyed(this)).subscribe((obj) => {
      if (obj) {
        this.setFormValues(obj);
      }
    });

    setTimeout(() => {
      this.subscribeNftList();
    }, 2000);
  }

  public get filesizes(): typeof FILE_SIZES {
    return FILE_SIZES;
  }

  private setFormValues(obj: Member): void {
    this.nameControl.setValue(obj.name);
    this.aboutControl.setValue(obj.about);
    this.discordControl.setValue(obj.discord);
    this.twitterControl.setValue(obj.twitter);
    this.githubControl.setValue(obj.github);
    if (obj?.avatarNft) {
      this.nftApi
        .listen(obj.avatarNft)
        .pipe(first())
        .subscribe((nft) => {
          if (nft) {
            this.avatarNftControl.setValue(obj.avatarNft);
            this.filteredNfts$.next([
              {
                label: nft.name,
                value: nft.uid,
              },
            ]);
            this.nftCache[nft.uid] = {
              name: nft.name,
              media: nft.media,
            };
          }
        });
    }
  }

  private subscribeNftList(search?: string): void {
    this.nftsSubscription?.unsubscribe();
    this.nftsSubscription = from(
      this.algoliaService.searchClient.initIndex(COL.NFT).search(search || '', {
        length: 10,
        offset: 0,
        filters: 'owner:' + this.auth.member$.value!.uid + ' AND ' + 'status:minted',
      }),
    ).subscribe((r) => {
      this.filteredNfts$.next(
        r.hits.map((r) => {
          const nft = r as unknown as Nft;
          this.nftCache[nft.uid] = {
            name: nft.name,
            media: nft.media,
          };
          return {
            label: nft.name,
            value: nft.uid,
          };
        }),
      );
    });
  }

  public searchNft(v: string): void {
    if (v) {
      this.subscribeNftList(v);
    }
  }

  public async save(): Promise<void> {
    this.memberForm.updateValueAndValidity();
    if (!this.memberForm.valid) {
      return;
    }

    const obj: any = this.memberForm.value;
    if (this.minted === false) {
      delete obj.currentProfileImage;
    }

    await this.auth.sign(this.memberForm.value, (sc, finish) => {
      this.notification
        .processRequest(this.memberApi.updateMember(sc), 'Updated', finish)
        .subscribe(() => {
          this.close();
        });
    });
  }

  public close(): void {
    this.wenOnClose.next();
  }
}
