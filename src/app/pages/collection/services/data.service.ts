import { Injectable } from '@angular/core';
import { Award, Collection, CollectionStats, Member, Nft, Space } from '@soonaverse/interfaces';
import { BehaviorSubject } from 'rxjs';
import {
  AuditOneQueryService,
  AuditOneResponseCollection,
} from 'src/app/service-modules/audit-one/services/query.service';

@Injectable({
  providedIn: 'any',
})
export class DataService {
  public collectionId?: string;
  public collection$: BehaviorSubject<Collection | undefined> = new BehaviorSubject<
    Collection | undefined
  >(undefined);
  public accessBadges$: BehaviorSubject<Award[] | undefined> = new BehaviorSubject<
    Award[] | undefined
  >(undefined);
  public accessCollections$: BehaviorSubject<string[] | undefined> = new BehaviorSubject<
    string[] | undefined
  >(undefined);
  public nft$: BehaviorSubject<Nft[] | undefined> = new BehaviorSubject<Nft[] | undefined>(
    undefined,
  );
  public isGuardianWithinSpace$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public isGuardianInRankModeratorSpace$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(
    false,
  );
  public space$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public royaltySpace$: BehaviorSubject<Space | undefined> = new BehaviorSubject<Space | undefined>(
    undefined,
  );
  public creator$: BehaviorSubject<Member | undefined> = new BehaviorSubject<Member | undefined>(
    undefined,
  );
  public collectionStats$: BehaviorSubject<CollectionStats | undefined> = new BehaviorSubject<
    CollectionStats | undefined
  >(undefined);
  public auditOneStatus$: BehaviorSubject<AuditOneResponseCollection | undefined> =
    new BehaviorSubject<AuditOneResponseCollection | undefined>(undefined);

  public isPending(collection?: Collection | null): boolean {
    return collection?.approved !== true && collection?.rejected !== true;
  }

  constructor(private auditOneModule: AuditOneQueryService) {}

  public async loadServiceModuleData(collectionId: string): Promise<void> {
    // Audit One widget.
    if (collectionId) {
      const space = await this.auditOneModule.getCollectionStatus(collectionId);
      this.auditOneStatus$.next(space);
    }
  }

  public reset(): void {
    this.collectionId = undefined;
    this.auditOneStatus$.next(undefined);
    // this.collection$.next(undefined);
    // this.cheapestNft$.next(undefined);
    // this.firstNft$.next(undefined);
    // this.nft$.next(undefined);
    // this.isGuardianWithinSpace$.next(false);
    // this.space$.next(undefined);
    // this.creator$.next(undefined);
  }
}
