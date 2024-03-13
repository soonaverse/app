import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NftSelectionService } from '@core/services/nft-selection/nft-selection.service';
import {
  Nft,
  NftTransferRequest,
  Transaction,
  Timestamp,
  COL,
  Member,
  NftAccess,
  WenError,
  RETRY_UNCOFIRMED_PAYMENT_DELAY,
  DEFAULT_NETWORK,
} from '@build-5/interfaces';
import {
  BehaviorSubject,
  Subscription,
  catchError,
  forkJoin,
  from,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { NftApi } from '@api/nft.api';
import { FileApi } from '@api/file.api';
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { StorageItem, setItem } from '@core/utils/local-storage.utils';
import dayjs from 'dayjs';
import { NzSelectOptionInterface } from 'ng-zorro-antd/select';
import { AlgoliaService } from '@components/algolia/services/algolia.service';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Build5ErrorLookupService } from '@core/services/build5-error-lookup/build5-error-lookup.service';
import { Router, ActivatedRoute } from '@angular/router';
import { NzModalService } from 'ng-zorro-antd/modal';
import { PreviewImageService } from '@core/services/preview-image';

interface TransNft extends Nft {
  transfer: boolean;
  withdraw: boolean;
  statusMessage?: string;
  disabled: boolean;
  transferred: TransferStatus;
  network?: string;
  mediaType?: 'video' | 'image';
}

interface HistoryItem {
  uniqueId: string;
  date: dayjs.Dayjs | Timestamp | null;
  label: string;
  transaction: Transaction;
  link?: string;
}

export enum TransferStatus {
  PENDING = 'pending',
  FAILURE = 'failure',
  SUCCESS = 'success',
}

@UntilDestroy()
@Component({
  selector: 'wen-nft-transfer',
  templateUrl: './nft-transfer.component.html',
  styleUrls: ['./nft-transfer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferModalComponent implements OnInit {
  public selectedNfts: TransNft[] = [];
  public recipientAddress = '';
  private nftSelectionSubscription$: Subscription = new Subscription();
  public selectedNetwork: string | null = null;
  private transSubscription$?: Subscription;
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public history: HistoryItem[] = [];

  public filteredMembers$: BehaviorSubject<NzSelectOptionInterface[]> = new BehaviorSubject<
    NzSelectOptionInterface[]
  >([]);
  private memberSubscription$?: Subscription;
  public targetAccessOption$ = new BehaviorSubject<NftAccess>(NftAccess.OPEN);
  public selectedAccessControl: FormControl = new FormControl(NftAccess.OPEN, Validators.required);
  public transferMemberControl: FormControl = new FormControl('');
  public form: FormGroup;

  constructor(
    private modalRef: NzModalRef,
    private nftSelectionService: NftSelectionService,
    private nftApi: NftApi,
    private cd: ChangeDetectorRef,
    public auth: AuthService,
    private orderApi: OrderApi,
    private notification: NotificationService,
    private nzNotification: NzNotificationService,
    public readonly algoliaService: AlgoliaService,
    private errorLookupService: Build5ErrorLookupService,
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private modal: NzModalService,
    public previewImageService: PreviewImageService,
    private fileApi: FileApi,
  ) {
    this.form = new FormGroup({
      selectedAccess: this.selectedAccessControl,
      buyer: this.transferMemberControl,
    });
  }

  ngOnInit(): void {
    this.nftSelectionSubscription$.add(
      this.nftSelectionService.selectedNftIds$
        .pipe(
          switchMap((ids) => {
            if (ids.length === 0) {
              return of([]);
            }
            return forkJoin(
              ids.map((id) =>
                this.nftApi.getNftById(id).pipe(
                  take(1),
                  catchError((error) => {
                    console.error(`Error fetching NFT with ID ${id}:`, error);
                    return of(null);
                  }),
                ),
              ),
            );
          }),
          map((nfts) =>
            nfts
              .filter((nft): nft is Nft => nft !== null && nft !== undefined)
              .map((nft) => ({
                ...nft,
                transfer: true,
                withdraw: false,
                disabled: false,
                statusMessage: 'Not transferred',
                transferred: TransferStatus.PENDING,
                network: nft.mintingData?.network || DEFAULT_NETWORK,
              })),
          ),
        )
        .subscribe((nfts) => {
          this.selectedNfts = this.sortNfts(nfts);
          this.updateNftMediaTypes();
          this.cd.markForCheck();
        }),
    );

    this.targetAccessOption$.pipe(untilDestroyed(this)).subscribe((targetAccessOption) => {
      this.selectedAccessControl.setValue(targetAccessOption);
    });
  }

  public updateNftMediaTypes(): void {
    this.selectedNfts.forEach((nft, index) => {
      if (nft.media) {
        this.fileApi
          .getMetadata(nft.media)
          .pipe(
            take(1),
            catchError((error) => {
              console.error(`Error fetching metadata for NFT ${nft.name}:`, error);
              return of(null);
            }),
            tap((mediaType) => {
              if (mediaType) {
                this.selectedNfts[index].mediaType = mediaType;
                this.cd.markForCheck();
              }
            }),
          )
          .subscribe();
      }
    });
  }

  private subscribeMemberList(search?: string): void {
    this.memberSubscription$?.unsubscribe();
    this.memberSubscription$ = from(
      this.algoliaService.searchClient
        .initIndex(COL.MEMBER)
        .search(search || '', { length: 5, offset: 0 }),
    ).subscribe((r) => {
      this.filteredMembers$.next(
        r.hits.map((r) => {
          const member = r as unknown as Member;
          return {
            label: '@' + member.name || member.uid,
            value: member.uid,
          };
        }),
      );
    });
  }

  public searchMember(v: string): void {
    if (v) {
      this.subscribeMemberList(v);
    }
  }

  public get targetAccess(): typeof NftAccess {
    return NftAccess;
  }

  public updateNetworkSelection(selectedNft: any): void {
    if (selectedNft.transfer) {
      this.selectedNetwork = selectedNft.mintingData?.network;
    } else if (this.selectedNfts.every((nft) => !nft.transfer)) {
      this.selectedNetwork = null;
    }
  }

  public isTransferEnabled(nft: any): boolean {
    return true; // return !this.selectedNetwork || this.selectedNetwork === nft.mintingData?.network;
  }

  public getSubmitButtonTooltip(): string {
    const addressTrue =
      (this.selectedAccessControl.value === 0 && !!this.recipientAddress) ||
      (this.selectedAccessControl.value === 1 && !!this.transferMemberControl.value);
    if (!addressTrue) {
      return 'Input address or choose member to allow transfer of NFTs';
    }
    if (this.selectedNfts.every((nft) => !nft.transfer)) {
      return 'Select which NFT(s) to transfer';
    }
    return '';
  }

  public canSubmit(): boolean {
    const addressTrue =
      (this.selectedAccessControl.value === 0 && !!this.recipientAddress) ||
      (this.selectedAccessControl.value === 1 && !!this.transferMemberControl.value);
    return addressTrue && this.selectedNfts.some((nft) => nft.transfer);
  }

  public async onSubmit(): Promise<void> {
    const sendToAddress =
      this.selectedAccessControl.value === 0
        ? this.recipientAddress
        : this.transferMemberControl.value;
    const request: NftTransferRequest = {
      transfers: this.selectedNfts
        .filter((nft) => nft.transfer)
        .map((nft) => ({
          nft: nft.uid,
          target: sendToAddress,
          withdraw: nft.withdraw || undefined,
        })),
    };

    const params = request;
    let successCnt = 0;
    let failCnt = 0;
    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.nftApi.transferNft(sc), $localize`Transfer initiated.`, finish)
        .subscribe((val: any) => {
          if (val && typeof val === 'object') {
            Object.entries(val).forEach(([nftId, responseCode]) => {
              const nftIndex = this.selectedNfts.findIndex((nft) => nft.uid === nftId);
              if (nftIndex !== -1) {
                if (responseCode === 200) {
                  this.selectedNfts[nftIndex].transfer = false;
                  this.selectedNfts[nftIndex].withdraw = false;
                  this.selectedNfts[nftIndex].disabled = true;
                  this.selectedNfts[nftIndex].statusMessage = 'NFT successfully transferred.';
                  this.selectedNfts[nftIndex].transferred = TransferStatus.SUCCESS;
                  successCnt = successCnt + 1;
                } else {
                  const codeDesc = this.getErrorDesc(responseCode as number);
                  this.selectedNfts[nftIndex].statusMessage = 'Error: ' + codeDesc;
                  this.selectedNfts[nftIndex].transferred = TransferStatus.FAILURE;
                  failCnt = failCnt + 1;
                }
              }
            });
          }
          if (successCnt > 0) {
            this.nzNotification.success(
              $localize`Successfully transferred ${successCnt} nfts.`,
              '',
            );
          }
          if (failCnt > 0) {
            this.nzNotification.error($localize`Failed to transfer ${failCnt} nfts.`, '');
          }
          if (successCnt > 0 || failCnt > 0) {
            this.showResultModal(successCnt, failCnt);
          }
          this.cd.markForCheck();
        });
    });
  }

  private showResultModal(successCnt: number, failCnt: number): void {
    const modalConfig = {
      nzTitle: 'NFT Transfer Results',
      nzContent: `<div class="flex items-center p-2 mt-2 rounded-xl bg-alerts-warning dark:bg-alerts-warning-dark text-foregrounds-primary dark:text-foregrounds-primary text-sm align-middle"><wen-icon-alert-octagon class="mr-1 lg:mr-2"></wen-icon-alert-octagon><div class="font-bold text-sm"><span>NFT Transfer Results:<br />Successful: ${successCnt}<br />Failed: ${failCnt}<br />Please refer to "Results" field in NFT transfer window for detailed results per NFT transferred.</span></div></div>`,
      nzClosable: true,
      nzOkText: 'Close',
    };

    this.modal.create(modalConfig);
  }

  public pushToHistory(
    transaction: Transaction,
    uniqueId: string,
    date?: dayjs.Dayjs | Timestamp | null,
    text?: string,
    link?: string,
  ): void {
    if (
      this.history.find((s) => {
        return s.uniqueId === uniqueId;
      })
    ) {
      return;
    }

    if (date && text) {
      this.history.unshift({
        transaction,
        uniqueId: uniqueId,
        date: date,
        label: text,
        link: link,
      });
    }
  }

  public handleCancel(): void {
    this.modalRef.destroy();
  }

  onModalClose(): void {
    const idsOfTransferredNfts = this.selectedNfts
      .filter((nft) => nft.disabled)
      .map((nft) => nft.uid);
    if (idsOfTransferredNfts.length > 0) {
      this.selectedNfts = this.selectedNfts.filter((nft) => !nft.disabled);

      idsOfTransferredNfts.forEach((nftId) => {
        this.nftSelectionService.deselectNft(nftId);
      });

      const memberId = this.auth.member$.value?.uid;
      if (memberId) {
        const expectedPath = `/member/${memberId}/nfts`;
        const currentPath = this.router.url;
        if (currentPath === expectedPath) {
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            window.location.href = `/member/${memberId}/nfts`;
          });
        }
      }
    }
  }

  private sortNfts(nfts: TransNft[]): TransNft[] {
    return nfts.sort((a, b) => {
      const networkA = a.mintingData?.network || '';
      const networkB = b.mintingData?.network || '';

      if (networkA < networkB) return -1;
      if (networkA > networkB) return 1;

      const nameA = a.name || '';
      const nameB = b.name || '';
      return nameA.localeCompare(nameB);
    });
  }

  public getErrorDesc(errorCode: number): string {
    return this.errorLookupService.getErrorMessage(errorCode);
  }

  public clearSelection() {
    this.nftSelectionService.clearSelection();
    this.modalRef.destroy();
  }

  public getNftMediaType(nft: TransNft): any {
    if (nft && nft.media) {
      return this.fileApi.getMetadata(nft.media);
    }
  }
}
