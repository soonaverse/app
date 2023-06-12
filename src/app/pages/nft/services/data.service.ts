import { Injectable } from '@angular/core';
import { OffersHistory, SuccesfullOrdersWithFullHistory } from '@api/nft.api';
import { AuthService } from '@components/auth/services/auth.service';
import { SelectCollectionOption } from '@components/collection/components/select-collection/select-collection.component';
import { Collection, Member, Nft, Space, Transaction } from '@build-5/interfaces';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'any',
})
export class DataService {
  public nftId?: string;
  public nft$: BehaviorSubject<Nft | undefined> = new BehaviorSubject<Nft | undefined>(undefined);
  public collection$: BehaviorSubject<Collection | undefined> = new BehaviorSubject<
    Collection | undefined
  >(undefined);
  public topNftWithinCollection$: BehaviorSubject<Nft[] | undefined> = new BehaviorSubject<
    Nft[] | undefined
  >(undefined);
  public firstNftInCollection$: BehaviorSubject<Nft | undefined> = new BehaviorSubject<
    Nft | undefined
  >(undefined);
  public orders$: BehaviorSubject<SuccesfullOrdersWithFullHistory[] | undefined> =
    new BehaviorSubject<SuccesfullOrdersWithFullHistory[] | undefined>(undefined);
  public ordersAllNetworks$: BehaviorSubject<SuccesfullOrdersWithFullHistory[] | undefined> =
    new BehaviorSubject<SuccesfullOrdersWithFullHistory[] | undefined>(undefined);
  public space$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public royaltySpace$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public creator$: BehaviorSubject<Member | undefined> = new BehaviorSubject<Member | undefined>(
    undefined,
  );
  public owner$: BehaviorSubject<Member | undefined> = new BehaviorSubject<Member | undefined>(
    undefined,
  );
  public collectionCreator$: BehaviorSubject<Member | undefined> = new BehaviorSubject<
    Member | undefined
  >(undefined);
  public pastBidTransactions$: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>(
    [],
  );
  public pastBidTransactionsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false,
  );
  public myBidTransactions$: BehaviorSubject<Transaction[]> = new BehaviorSubject<Transaction[]>(
    [],
  );
  public myBidTransactionsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public allBidTransactions$: BehaviorSubject<OffersHistory[]> = new BehaviorSubject<
    OffersHistory[]
  >([]);
  public allBidTransactionsLoading$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public saleAccessMembers$: BehaviorSubject<Member[] | undefined> = new BehaviorSubject<
    Member[] | undefined
  >(undefined);

  public constructor(private auth: AuthService) {
    // none.
  }

  public reset(): void {
    this.nftId = undefined;
    // this.nft$.next(undefined);
    // this.collection$.next(undefined);
    // this.topNftWithinCollection$.next(undefined);
    // this.firstNftInCollection$.next(undefined);
    // this.orders$.next(undefined);
    // this.space$.next(undefined);
    // this.royaltySpace$.next(undefined);
    // this.creator$.next(undefined);
    // this.owner$.next(undefined);
    // this.collectionCreator$.next(undefined);
  }

  public getCollectionListOptions(list?: Collection[] | null): SelectCollectionOption[] {
    return (list || [])
      .filter((o) => {
        if (!this.auth.member$.value) {
          return false;
        }

        return o.rejected !== true && o.createdBy === this.auth.member$.value.uid;
      })
      .map((o) => ({
        label: o.name || o.uid,
        value: o.uid,
      }));
  }
}
