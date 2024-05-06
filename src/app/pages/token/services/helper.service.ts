import { Injectable } from '@angular/core';
import { UnitsService } from '@core/services/units';
import {
  Network,
  TRANSACTION_AUTO_EXPIRY_MS,
  Token,
  TokenDrop,
  TokenStatus,
  TokenTradeOrder,
  TokenTradeOrderStatus,
  Transaction,
  TransactionType,
} from '@buildcore/interfaces';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

@Injectable({
  providedIn: 'root',
})
export class HelperService {
  constructor(public unitsService: UnitsService) {}

  public percentageMarketCap(percentage: number, token?: Token): number {
    if (!token) {
      return 0;
    }
    return Math.floor(token?.pricePerToken * ((token?.totalSupply * percentage) / 100));
  }

  public getPairFrom(token?: Token | null): string {
    let from = '';
    const net = token?.mintingData?.networkFormat || token?.mintingData?.network;
    if (net === Network.ATOI) {
      from = 'MATOI';
    } else if (net === Network.SMR) {
      from = 'SMR';
    } else if (net === Network.RMS) {
      from = 'RMS';
    } else {
      from = 'IOTA';
    }
    return from;
  }

  public getPair(token?: Token | null): string {
    return token?.symbol + '/' + this.getPairFrom(token);
  }

  public isBase(token?: Token | null): boolean {
    return token?.status === TokenStatus.BASE;
  }

  public saleEndDate(token?: Token): dayjs.Dayjs {
    return dayjs(token?.saleStartDate?.toDate()).add(token?.saleLength || 0, 'ms');
  }

  public isInProcessing(token?: Token): boolean {
    return token?.status === TokenStatus.PROCESSING;
  }

  public isScheduledForSale(token?: Token): boolean {
    return (
      !!token?.approved &&
      (token?.status === TokenStatus.AVAILABLE || token?.status === TokenStatus.PROCESSING) &&
      !!token?.saleStartDate
    );
  }

  public isAfterSaleStarted(token?: Token): boolean {
    return !!token?.approved && dayjs(token?.saleStartDate?.toDate()).isBefore(dayjs());
  }

  public isProcessing(token?: Token): boolean {
    return token?.status === TokenStatus.PROCESSING;
  }

  public isInCooldown(token?: Token): boolean {
    return (
      !!token?.approved &&
      (token?.status === TokenStatus.AVAILABLE || token?.status === TokenStatus.PROCESSING) &&
      dayjs(token?.coolDownEnd?.toDate()).isAfter(dayjs()) &&
      dayjs(token?.saleStartDate?.toDate())
        .add(token?.saleLength || 0, 'ms')
        .isBefore(dayjs())
    );
  }

  public isAvailableForSale(token?: Token): boolean {
    return (
      !!token?.approved &&
      token?.status === TokenStatus.AVAILABLE &&
      dayjs(token?.saleStartDate?.toDate()).isBefore(dayjs()) &&
      dayjs(token?.saleStartDate?.toDate())
        .add(token?.saleLength || 0, 'ms')
        .isAfter(dayjs())
    );
  }

  public isSalesInProgress(token?: Token): boolean {
    return (
      !!token?.approved &&
      token?.status === TokenStatus.AVAILABLE &&
      dayjs(token?.saleStartDate?.toDate()).isBefore(dayjs()) &&
      dayjs(token?.coolDownEnd?.toDate()).isAfter(dayjs())
    );
  }

  public isMinted(token?: Token | null): boolean {
    return token?.status === TokenStatus.MINTED || token?.status === TokenStatus.BASE;
  }

  public isMintingInProgress(token?: Token | null): boolean {
    return token?.status === TokenStatus.MINTING;
  }

  public getExplorerUrl(token?: Token | null): string {
    if (token?.mintingData?.network === Network.RMS) {
      return 'https://explorer.shimmer.network/testnet/foundry/' + token.mintingData.tokenId;
    } else if (token?.mintingData?.network === Network.IOTA) {
      return 'https://explorer.iota.org/mainnet/block/' + token.mintingData.blockId;
    } else if (token?.mintingData?.network === Network.SMR) {
      return 'https://explorer.shimmer.network/shimmer/foundry/' + token.mintingData.tokenId;
    } else if (token?.mintingData?.network === Network.ATOI) {
      return 'https://explorer.iota.org/devnet/search/' + token.mintingData.blockId;
    } else {
      return '';
    }
  }

  public hasPublicSale(token?: Token): boolean {
    return !!(token?.allocations && token.allocations.filter((a) => a.isPublicSale).length > 0);
  }

  public canSchedulePublicSale(token?: Token): boolean {
    return (
      !!token &&
      !token?.saleStartDate &&
      token?.approved &&
      this.hasPublicSale(token) &&
      !this.isMinted(token)
    );
  }

  public getShareUrl(): string {
    return window?.location.href;
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

  public vestingInFuture(drop?: TokenDrop): boolean {
    if (!drop) {
      return false;
    }
    return dayjs(drop.vestingAt.toDate()).isAfter(dayjs());
  }

  public salesInProgressOrUpcoming(token?: Token): boolean {
    return (
      !!token?.saleStartDate &&
      dayjs(token.saleStartDate?.toDate()).isBefore(dayjs()) &&
      token?.status !== TokenStatus.PRE_MINTED &&
      token?.approved
    );
  }

  public getTradeOrderStatus(tradeOrder: TokenTradeOrder): string | undefined {
    if (
      tradeOrder.status === TokenTradeOrderStatus.ACTIVE ||
      tradeOrder.status === TokenTradeOrderStatus.SETTLED
    ) {
      return ((tradeOrder.fulfilled / tradeOrder.count) * 100).toFixed(0).toString() + '%' || '';
    }
    if (
      tradeOrder.status === TokenTradeOrderStatus.CANCELLED ||
      tradeOrder.status === TokenTradeOrderStatus.PARTIALLY_SETTLED_AND_CANCELLED
    ) {
      return $localize`Cancelled`;
    }
    if (tradeOrder.status === TokenTradeOrderStatus.EXPIRED) {
      return $localize`Expired`;
    }
    return undefined;
  }
}
