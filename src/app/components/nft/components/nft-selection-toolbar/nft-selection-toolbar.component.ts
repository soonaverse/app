import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { NftSelectionService } from '@core/services/nft-selection/nft-selection.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { TransferModalComponent } from '@components/nft/components/nft-transfer/nft-transfer.component'

@Component({
  selector: 'wen-nft-selection-toolbar',
  templateUrl: './nft-selection-toolbar.component.html',
  styleUrls: ['./nft-selection-toolbar.component.less'],
  animations: [
    trigger('slideFromBottom', [
      transition(':enter', [
        style({ transform: 'translateY(100%)' }),
        animate('300ms ease-out', style({ transform: 'translateY(0)' }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ transform: 'translateY(100%)' }))
      ])
    ]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftSelectionToolbarComponent implements OnInit {
  public selectedCount$!: Observable<number>;

  constructor(
    private nftSelectionService: NftSelectionService,
    private modalService: NzModalService,
  ) {}

  ngOnInit(): void {
    // Observable for the count of selected NFTs remains the same
    this.selectedCount$ = this.nftSelectionService.selectedNftIds$.pipe(
      map(ids => ids.length)
    );
  }

  public clearSelection() {
    this.nftSelectionService.clearSelection();
  }

  public openTransferModal() {
    const modal = this.modalService.create({
      nzTitle: 'Transfer NFTs',
      nzContent: TransferModalComponent,
      nzClassName: 'nft-transfer-modal',
      nzFooter: null,
      nzWidth: '75%',
      nzComponentParams: {

      },
      nzOnOk: () => new Promise(resolve => setTimeout(resolve, 1000)),
      nzOnCancel: () => console.log('Cancel transfer'),
    });

    modal.afterClose.subscribe(result => {
      const componentInstance = modal.getContentComponent();
      componentInstance.onModalClose();
      this.nftSelectionService.notifyModalClosed();
    });
  }


}
