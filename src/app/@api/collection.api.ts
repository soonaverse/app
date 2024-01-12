import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Collection,
  Dataset,
  Transaction,
  WEN_FUNC,
  Build5Request,
  CollectionMintRequest,
  VoteRequest,
  RankRequest,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  RejectCollectionRequest,
  Subset,
} from '@build-5/interfaces';
import { Observable, of } from 'rxjs';
import { BaseApi } from './base.api';

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
  private collectionDataset = this.project.dataset(Dataset.COLLECTION);

  constructor(protected httpClient: HttpClient) {
    super(Dataset.COLLECTION, httpClient);
  }

  public mintCollection = (
    req: Build5Request<CollectionMintRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.mintCollection, req);

  public vote = (req: Build5Request<VoteRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.voteController, req);

  public rank = (req: Build5Request<RankRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.rankController, req);

  public stats = (collectionId: string) =>
    collectionId
      ? this.collectionDataset
          .id(collectionId)
          .subset(Subset.STATS)
          .subsetId(collectionId)
          .getLive()
      : of(undefined);

  public allPendingSpace = (space: string, lastValue?: string) =>
    this.collectionDataset.getAllPendingLive(space, lastValue);

  public allAvailableSpace = (space: string, lastValue?: string) =>
    this.collectionDataset.getAllAvailableLive(space, lastValue);

  public allRejectedSpace = (space: string, lastValue?: string) =>
    this.collectionDataset.getAllRejectedLive(space, lastValue);

  public create = (
    req: Build5Request<CreateCollectionRequest>,
  ): Observable<Collection | undefined> => this.request(WEN_FUNC.createCollection, req);

  public update = (
    req: Build5Request<UpdateCollectionRequest>,
  ): Observable<Collection | undefined> => this.request(WEN_FUNC.updateCollection, req);

  public reject = (
    req: Build5Request<RejectCollectionRequest>,
  ): Observable<Collection | undefined> => this.request(WEN_FUNC.rejectCollection, req);
}
