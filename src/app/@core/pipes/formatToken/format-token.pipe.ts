import { Pipe, PipeTransform } from '@angular/core';
import { CacheService } from '@core/services/cache/cache.service';
import {
  DEFAULT_NETWORK,
  NETWORK_DETAIL,
  Network,
  getDefDecimalIfNotSet,
} from '@soonaverse/interfaces';
import { firstValueFrom, skipWhile } from 'rxjs';

const DEF_DECIMALS = 6;
export interface ConvertValue {
  value: number | null | undefined;
  exponents: number | null | undefined; // DEFAULT TO SIX
}
@Pipe({
  name: 'formatToken',
})
export class FormatTokenPipe implements PipeTransform {
  public constructor(private cache: CacheService) {}
  public async transformTest(
    _value: number | null | undefined | ConvertValue,
    _tokenUidOrNetwork?: string | null,
    _removeZeroes = false,
    _showUnit = true,
    _defDecimals = DEF_DECIMALS,
  ): Promise<string> {
    return '';
  }

  public async transform(
    value: number | null | undefined | ConvertValue,
    tokenUidOrNetwork?: string | null,
    removeZeroes = false,
    showUnit = true,
    defDecimals = DEF_DECIMALS,
  ): Promise<string> {
    let network = DEFAULT_NETWORK;
    if (typeof value === 'object') {
      if (value?.value) {
        value = this.multiValue(value);
      } else {
        value = 0;
      }
    }

    if (!value) {
      value = 0;
    }

    let tokenUid: string | undefined = undefined;
    if (tokenUidOrNetwork) {
      if (Object.keys(Network).includes(tokenUidOrNetwork.toUpperCase())) {
        network = <Network>tokenUidOrNetwork;
      } else {
        tokenUid = tokenUidOrNetwork;
      }
    }

    if (tokenUid) {
      const token = await firstValueFrom(
        this.cache.getToken(tokenUid).pipe(
          skipWhile((t) => {
            return !t;
          }),
        ),
      );
      if (!token) {
        // Unable to get token.
        return '-';
      }

      // We default to IOTA if it's not minted yet.
      network = token.mintingData?.networkFormat || token.mintingData?.network || DEFAULT_NETWORK;
      if (defDecimals > token.decimals) {
        defDecimals = token.decimals;
      }

      value = value / Math.pow(10, getDefDecimalIfNotSet(token.decimals));
    } else {
      value = value / NETWORK_DETAIL[network].divideBy;
    }

    const parts = (removeZeroes ? value : value.toFixed(defDecimals)).toString().split('.');
    const formattedValue =
      parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (parts.length === 2 ? '.' + parts[1] : '');
    return formattedValue + (showUnit ? ` ${NETWORK_DETAIL[network].label}` : '');
  }

  public multiValue(value: ConvertValue): number {
    if (value.exponents === 0) {
      return value.value!;
    } else {
      return value.value! * Math.pow(10, getDefDecimalIfNotSet(value.exponents));
    }
  }
}
