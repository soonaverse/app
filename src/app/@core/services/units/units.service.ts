import { Injectable } from '@angular/core';
import { DEFAULT_NETWORK, Network, NETWORK_DETAIL } from '@soonaverse/interfaces';
import { map, Observable } from 'rxjs';
import { CacheService } from '../cache/cache.service';

@Injectable({
  providedIn: 'root',
})
export class UnitsService {
  constructor(private cache: CacheService) {
    // noe.
  }

  public label(network?: Network | null): string {
    return NETWORK_DETAIL[network || DEFAULT_NETWORK].label;
  }

  public getUsd(value: number | null | undefined, network?: Network | null): Observable<number> {
    if (!network) {
      network = DEFAULT_NETWORK;
    }

    if (!value) {
      value = 0;
    }

    const mapPrice = (o: number) => {
      return o * value!;
    };

    if (network === Network.IOTA) {
      return this.cache.iotaUsdPrice$.pipe(map(mapPrice));
    } else {
      return this.cache.smrUsdPrice$.pipe(map(mapPrice));
    }
  }
}
