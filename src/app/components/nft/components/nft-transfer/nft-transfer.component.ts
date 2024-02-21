import { ChangeDetectionStrategy, Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NftSelectionService } from '@core/services/nft-selection/nft-selection.service';
import { Nft, NftTransferRequest, Transaction, Timestamp, } from '@build-5/interfaces';
import { BehaviorSubject, Subscription, catchError, forkJoin, map, of, switchMap, take, tap } from 'rxjs';
import { NftApi } from '@api/nft.api';
import { OrderApi } from '@api/order.api';
import { AuthService } from '@components/auth/services/auth.service';
import { NotificationService } from '@core/services/notification';
import { StorageItem, setItem } from '@core/utils/local-storage.utils';
import dayjs from 'dayjs';

interface TransNft extends Nft {
  transfer: boolean;
  withdraw: boolean;
}

interface HistoryItem {
  uniqueId: string;
  date: dayjs.Dayjs | Timestamp | null;
  label: string;
  transaction: Transaction;
  link?: string;
}

@Component({
  selector: 'wen-nft-transfer',
  templateUrl: './nft-transfer.component.html',
  styleUrls: ['./nft-transfer.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransferModalComponent implements OnInit {
  public selectedNfts: TransNft[] = [];
  public recipientAddress: string = '';
  private nftSelectionSubscription$: Subscription = new Subscription();
  public selectedNetwork: string | null = null;
  private transSubscription$?: Subscription;
  public transaction$: BehaviorSubject<Transaction | undefined> = new BehaviorSubject<
    Transaction | undefined
  >(undefined);
  public history: HistoryItem[] = [];

  constructor(
    private modalRef: NzModalRef,
    private nftSelectionService: NftSelectionService,
    private nftApi: NftApi,
    private cd: ChangeDetectorRef,
    public auth: AuthService,
    private orderApi: OrderApi,
    private notification: NotificationService,
  ) {}

  ngOnInit(): void {
    console.log('nft-transfer.component ngOnInit fired.');
    this.nftSelectionSubscription$.add(
      this.nftSelectionService.selectedNftIds$
        .pipe(
          tap(ids => console.log('IDs before switchMap:', ids)),
          switchMap(ids => {
            if (ids.length === 0) {
              console.log('nft-transfer.component ngOnInit - there are no nft IDs, return empty array.');
              return of([]);
            }
            console.log('mid check');
            return forkJoin(ids.map(id => this.nftApi.getNftById(id).pipe(
              tap(_ => console.log(`Fetched NFT with ID ${id}`)),
              take(1),
              catchError(error => {
                console.error(`Error fetching NFT with ID ${id}:`, error);
                return of(null);
              })
            )));
          }),
          tap(nfts => console.log('NFTs after filtering:', nfts)),
          map(nfts => nfts.filter((nft): nft is Nft => nft !== null && nft !== undefined)
            .map(nft => ({
              ...nft,
              transfer: false,
              withdraw: false
            }))
          )
        )
        .subscribe(nfts => {
          this.selectedNfts = this.sortNfts(nfts);
          console.log('Sorted NFTs: ', this.selectedNfts);
          this.cd.markForCheck();
        })

    );
  }

  public updateNetworkSelection(selectedNft: any): void {
    if (selectedNft.transfer) {
      this.selectedNetwork = selectedNft.mintingData?.network;
    } else if (this.selectedNfts.every(nft => !nft.transfer)) {
      this.selectedNetwork = null;
    }
  }

  public isTransferEnabled(nft: any): boolean {
    return !this.selectedNetwork || this.selectedNetwork === nft.mintingData?.network;
  }

  public getSubmitButtonTooltip(): string {
    if (!this.recipientAddress) {
      return 'Input address to allow transfer of NFTs';
    }
    if (this.selectedNfts.every(nft => !nft.transfer)) {
      return 'Select which NFTs to transfer';
    }
    return '';
  }

  public canSubmit(): boolean {
    return !!this.recipientAddress && this.selectedNfts.some(nft => nft.transfer);
  }

  public async onSubmit(): Promise<void> {
    const request: NftTransferRequest = {
      transfers: this.selectedNfts
        .filter(nft => nft.transfer)
        .map(nft => ({
          nft: nft.uid,
          target: this.recipientAddress,
          withdraw: nft.withdraw || undefined
        }))
    };
    console.log('nft-transfer.component onSubmit - NftTransferRequest created: ', request);

    const params = request;
    await this.auth.sign(params, (sc, finish) => {
      this.notification
        .processRequest(this.nftApi.transferNft(sc), $localize`Order created.`, finish)
        .subscribe((val: any) => {
          console.log('nft-transfer.component onSubmit - subscribing to order from processRequest, val: ', val);
          this.transSubscription$?.unsubscribe();
          setItem(StorageItem.TransferNftsTransaction, val.uid);
          this.transSubscription$ = this.orderApi.listen(val.uid).subscribe(<any>this.transaction$);
          console.log('nft-transfer.component onSubmit - new this.transSubscription$: ', this.transSubscription$);
          this.pushToHistory(val, val.uid, dayjs(), $localize`Waiting for transaction...`);
        });
    });
  }

  public pushToHistory(
    transaction: Transaction,
    uniqueId: string,
    date?: dayjs.Dayjs | Timestamp | null,
    text?: string,
    link?: string,
  ): void {
    console.log('nft-transfer.component pushToHistory fired.');
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


}
