import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Nft } from '@soonaverse/interfaces';
import { SaleType, UpdateEvent } from '../nft-sale.component';

@Component({
  selector: 'wen-nft-sale-not-for-sale',
  templateUrl: './nft-sale-not-for-sale.component.html',
  styleUrls: ['./nft-sale-not-for-sale.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NftSaleNotForSaleComponent {
  @Input()
  set nft(value: Nft | null | undefined) {
    this._nft = value;
    if (this._nft?.availableFrom || this._nft?.auctionFrom) {
      this.clear = true;
    }
  }

  get nft(): Nft | null | undefined {
    return this._nft;
  }

  @Output() public wenOnUpdate = new EventEmitter<UpdateEvent>();
  public clear = false;
  private _nft?: Nft | null;

  public submit(): void {
    this.wenOnUpdate.next({
      type: SaleType.NOT_FOR_SALE,
    });
  }
}
