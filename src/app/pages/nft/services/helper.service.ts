import { Injectable } from '@angular/core';
import { SuccesfullOrdersWithFullHistory } from '@api/nft.api';
import {
  DescriptionItem,
  DescriptionItemType,
} from '@components/description/description.component';
import { getItem, StorageItem } from '@core/utils';
import {
  Collection,
  CollectionStatus,
  Network,
  Nft,
  NftStatus,
  PropStats,
  Timestamp,
  Transaction,
  TransactionType,
  TRANSACTION_AUTO_EXPIRY_MS,
} from '@build-5/interfaces';
import dayjs from 'dayjs';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';

dayjs.extend(isSameOrBefore);

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  public getPropStats(obj: PropStats | undefined = {}): DescriptionItem[] {
    if (!obj) {
      return [];
    }

    const final: any[] = [];
    for (const v of Object.values(obj).sort(function (a: any, b: any) {
      if (a.label < b.label) {
        return -1;
      }
      if (a.label > b.label) {
        return 1;
      }
      return 0;
    })) {
      final.push({ title: v.label, type: DescriptionItemType.DEFAULT_NO_TRUNCATE, value: v.value });
    }

    return final;
  }

  public auctionInProgress(nft?: Nft | null, col?: Collection | null): boolean {
    if (!col) {
      return false;
    }

    return (
      col.approved === true &&
      !!nft?.auctionFrom &&
      !!nft?.auctionTo &&
      dayjs(nft.auctionFrom.toDate()).isSameOrBefore(dayjs(), 's') &&
      dayjs(nft.auctionTo.toDate()).isAfter(dayjs(), 's')
    );
  }

  public getAuctionEnd(nft?: Nft | null): dayjs.Dayjs | undefined {
    if (!nft?.auctionTo) {
      return;
    }

    return dayjs(nft.auctionTo.toDate());
  }

  public getActionStart(nft?: Nft | null): dayjs.Dayjs | undefined {
    if (!nft?.auctionFrom) {
      return;
    }

    return dayjs(nft.auctionFrom.toDate());
  }

  public isMinted(nft?: Nft | null, col?: Collection | null): boolean {
    if (nft?.placeholderNft) {
      return col?.status === CollectionStatus.MINTED;
    } else {
      return nft?.status === NftStatus.MINTED;
    }
  }

  public isCollectionBeingMinted(col?: Collection | null): boolean {
    return col?.status === CollectionStatus.MINTING;
  }

  public getSaleStart(nft?: Nft | null): dayjs.Dayjs | undefined {
    if (!nft?.availableFrom) {
      return;
    }

    return dayjs(nft.availableFrom.toDate());
  }

  public getCountdownDate(nft?: Nft | null): dayjs.Dayjs | undefined {
    if (this.isDateInFuture(nft?.availableFrom)) {
      return this.getSaleStart(nft);
    }
    if (this.isDateInFuture(nft?.auctionFrom)) {
      return this.getActionStart(nft);
    }
    if (this.isDateInFuture(nft?.auctionTo)) {
      return this.getAuctionEnd(nft);
    }
    return undefined;
  }

  public isDateInFuture(date?: Timestamp | null): boolean {
    if (!this.getDate(date)) {
      return false;
    }

    return dayjs(this.getDate(date)).isAfter(dayjs(), 's');
  }

  public getDaysLeft(availableFrom?: Timestamp | null): number {
    if (!this.getDate(availableFrom)) return 0;
    return dayjs(this.getDate(availableFrom)).diff(dayjs(new Date()), 'day');
  }

  public getDate(date: any): any {
    // console.log(`[getDate] Original input:`, date);
    if (typeof date === 'object') {
      if (date?.toDate) {

        const dateFromObject = date.toDate();
        // console.log(`[getDate] Object with toDate method detected, toDate result:`, dateFromObject);
        return dateFromObject;
      } else if (date?.seconds) {

        const dateFromSeconds = new Date(date.seconds * 1000); // Convert to milliseconds
        // console.log(`[getDate] Object with seconds property detected, converted to Date:`, dateFromSeconds);
        return dateFromSeconds;
      }
    }
    // console.log(`[getDate] Returning undefined, input could not be parsed as a date.`);
    return undefined;
  }

  public getCountdownTitle(nft?: Nft | null): string {
    if (this.isDateInFuture(nft?.availableFrom)) {
      return $localize`Sale Starts`;
    }
    if (this.isDateInFuture(nft?.auctionFrom)) {
      return $localize`Auction Starts`;
    }
    if (this.isDateInFuture(nft?.auctionTo)) {
      return $localize`Auction Ends`;
    }
    return '';
  }

  public getShareUrl(): string {
    return window?.location.href;
  }

  public isLocked(nft?: Nft | null, col?: Collection | null, exceptMember = false): boolean {
    if (!col) {
      return false;
    }

    return (
      col.approved === true &&
      ((nft?.locked === true && !exceptMember) ||
        (exceptMember &&
          nft?.locked === true &&
          nft?.lockedBy !== getItem(StorageItem.CheckoutTransaction)))
    );
  }

  public isAvailableForSale(nft?: Nft | null, col?: Collection | null): boolean {
    // console.log("[NFThelper-isAvailableForSale] function called");
    if (!col || !nft?.availableFrom || col?.status === CollectionStatus.MINTING) {
      // console.log("[NFT helper.service.ts] isAvailableForSale function returning false.  nft name: " + nft?.name + ", col name: " + col?.name)
      return false;
    }


    const isAvail = (
      col.approved === true &&
      !!this.getDate(nft.availableFrom) &&
      dayjs(this.getDate(nft.availableFrom)).isSameOrBefore(dayjs(), 's')
    );
    // console.log("[NFT helper.service.ts] isAvailableForSale function returning " + isAvail + ".  nft name: " + nft?.name + ", col name: " + col?.name + ". nft.availableFrom: " + nft.availableFrom.seconds);
    // console.log("col.approved: " + (col.approved === true));
    // console.log("!!this.getDate(nft.availableFrom): " + !!this.getDate(nft.availableFrom) + ", this.getDate(nft.availableFrom): " + this.getDate(nft.availableFrom));
    // console.log("dayjs(this.getDate(nft.availableFrom)).isSameOrBefore(dayjs(), 's')" + dayjs(this.getDate(nft.availableFrom)).isSameOrBefore(dayjs(), 's'));
    return isAvail;
  }

  public canBeSetForSale(nft?: Nft | null): boolean {
    if (nft?.auctionFrom || nft?.availableFrom) {
      return false;
    }

    return !!nft?.owner;
  }

  public isAvailableForAuction(nft?: Nft | null, col?: Collection | null): boolean {
    if (!col || !nft?.auctionFrom || col?.status === CollectionStatus.MINTING) {
      return false;
    }

    return (
      col.approved === true &&
      !!this.getDate(nft.auctionFrom) &&
      dayjs(this.getDate(nft!.auctionFrom)).isSameOrBefore(dayjs(), 's')
    );
  }

  public willBeAvailableForAuction(nft?: Nft | null, col?: Collection | null): boolean {
    if (!col || col?.status === CollectionStatus.MINTING) {
      return false;
    }

    return (
      col.approved === true &&
      !!nft?.auctionFrom &&
      dayjs(this.getDate(nft.auctionFrom)).isAfter(dayjs(), 's')
    );
  }

  public saleNotStartedYet(nft?: Nft | null): boolean {
    if (!this.getDate(nft?.availableFrom)) {
      return false;
    }

    return dayjs(this.getDate(nft!.availableFrom)).isAfter(dayjs(), 's');
  }

  public getLatestBill(orders?: SuccesfullOrdersWithFullHistory[] | null): Transaction | undefined {
    if (!orders) {
      return undefined;
    }

    // Get all non royalty bills.
    let lastestBill: Transaction | undefined = undefined;
    for (const h of orders) {
      for (const l of h.transactions || []) {
        if (
          l.type === TransactionType.BILL_PAYMENT &&
          l.payload.royalty === false &&
          l.payload.reconciled === true &&
          (!lastestBill ||
            dayjs(this.getDate(lastestBill.createdOn)).isBefore(this.getDate(l.createdOn)))
        ) {
          lastestBill = l;
        }
      }
    }

    return lastestBill;
  }

  public isExpired(val?: Transaction | null): boolean {
    if (!val?.createdOn) {
      return false;
    }

    const expiresOn: dayjs.Dayjs = dayjs(val.createdOn.toDate()).add(
      TRANSACTION_AUTO_EXPIRY_MS,
      'ms',
    );
    return expiresOn.isBefore(dayjs()) && val.type === TransactionType.ORDER;
  }

  public getExplorerUrl(rec?: Nft | Collection | null): string {
    if (rec?.mintingData?.network === Network.RMS) {
      return 'https://explorer.shimmer.network/testnet/block/' + rec.mintingData.blockId;
    } else if (rec?.mintingData?.network === Network.IOTA) {
      return 'https://explorer.iota.org/mainnet/block/' + rec.mintingData.blockId;
    } else if (rec?.mintingData?.network === Network.SMR) {
      return 'https://explorer.shimmer.network/shimmer/block/' + rec.mintingData.blockId;
    } else if (rec?.mintingData?.network === Network.ATOI) {
      return 'https://explorer.iota.org/devnet/search/' + rec.mintingData.blockId;
    } else {
      return '';
    }
  }
}
