import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Collection,
  PublicCollections,
  Transaction,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import { CollectionRepository, CollectionStatsRepository } from '@build-5/lib';
import { Observable, of } from 'rxjs';
import { BaseApi, SOON_ENV } from './base.api';

export enum CollectionFilter {
  ALL = 'all',
  PENDING = 'pending',
  REJECTED = 'rejected',
  AVAILABLE = 'available',
}

@Injectable({
  providedIn: 'root',
})
export class CollectionApi extends BaseApi<Collection> {
  protected colRepo = new CollectionRepository(SOON_ENV);
  protected colStatRepo = new CollectionStatsRepository(SOON_ENV);

  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.COLLECTION, httpClient);
  }

  public mintCollection = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.mintCollection, req);

  public vote = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.voteController, req);

  public rank = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.rankController, req);

  public stats = (collectionId: string) =>
    collectionId ? this.colStatRepo.getByIdLive(collectionId, collectionId) : of(undefined);

  public allPendingSpace = (space: string, lastValue?: string) =>
    this.colRepo.getAllPendingLive(space, lastValue);

  public allAvailableSpace = (space: string, lastValue?: string) =>
    this.colRepo.getAllAvailableLive(space, lastValue);

  public allRejectedSpace = (space: string, lastValue?: string) =>
    this.colRepo.getAllRejectedLive(space, lastValue);

  public create = (req: WenRequest): Observable<Collection | undefined> =>
    this.request(WEN_FUNC.createCollection, req);

  public update = (req: WenRequest): Observable<Collection | undefined> =>
    this.request(WEN_FUNC.updateCollection, req);

  public reject = (req: WenRequest): Observable<Collection | undefined> =>
    this.request(WEN_FUNC.rejectCollection, req);
}
