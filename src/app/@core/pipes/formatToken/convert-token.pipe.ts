import { Pipe, PipeTransform } from '@angular/core';
import { CacheService } from '@core/services/cache/cache.service';
import {
  DEFAULT_NETWORK,
  NETWORK_DETAIL,
  Network,
  getDefDecimalIfNotSet,
} from '@build-5/interfaces';
import { firstValueFrom, skipWhile } from 'rxjs';

export interface ConvertValue {
  value: number | null | undefined;
  exponents: number | null | undefined; // DEFAULT TO SIX
}
@Pipe({
  name: 'convertToken',
})
export class ConvertTokenPipe implements PipeTransform {
  public constructor(private cache: CacheService) {}
  public async transform(
    value: number,
    tokenUidOrNetwork: string | null | Network = DEFAULT_NETWORK,
  ): Promise<number> {
    if (tokenUidOrNetwork === null || tokenUidOrNetwork === undefined) {
      tokenUidOrNetwork = DEFAULT_NETWORK;
    }

    if (!value) {
      value = 0;
    }

    if (Object.keys(Network).includes(tokenUidOrNetwork.toUpperCase())) {
      value = value * NETWORK_DETAIL[<Network>tokenUidOrNetwork].divideBy;
    } else {
      const token = await firstValueFrom(
        this.cache.getToken(tokenUidOrNetwork).pipe(
          skipWhile((t) => {
            return !t;
          }),
        ),
      );
      if (!token) {
        // Unable to get token.
        return 0;
      }

      value = value * Math.pow(10, getDefDecimalIfNotSet(token.decimals));
    }

    return value;
  }
}
