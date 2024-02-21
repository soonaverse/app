import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  NetworkAddress,
  BUILD5_PROD_ADDRESS_API,
  BUILD5_TEST_ADDRESS_API,
  WEN_FUNC,
  Build5Request,
  Dataset,
} from '@build-5/interfaces';
import { https, Build5, SoonaverseApiKey } from '@build-5/sdk';
import { Observable, of } from 'rxjs';

export const DEFAULT_LIST_SIZE = 50;
export const WHERE_IN_BATCH = 10;
export const FULL_LIST = 10000;
// TODO Migrations that should happen.
export const FULL_TODO_CHANGE_TO_PAGING = FULL_LIST;
export const FULL_TODO_MOVE_TO_PROTOCOL = FULL_LIST;

export const ORIGIN = environment.production ? Build5.PROD : Build5.TEST;
export const API_KEY = SoonaverseApiKey[ORIGIN];

export enum AwardFilter {
  ALL = 'all',
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
}

export class BaseApi<T> {
  protected project = https(ORIGIN).project(API_KEY);

  constructor(public readonly dataset: Dataset, protected httpClient: HttpClient) {}

  public listen = (id: string): Observable<T> =>
    this.project.dataset(this.dataset).id(id).getLive() as Observable<T>;

  public listenMultiple = (ids: NetworkAddress[]): Observable<T[]> =>
    ids.length
      ? (this.project.dataset(this.dataset).getManyByIdLive(ids) as Observable<T[]>)
      : of([]);

  public top = (lastValue?: string, limit?: number): Observable<T[]> =>
    this.project.dataset(this.dataset).getTopLive(lastValue, limit) as Observable<T[]>;

  protected request<T>(func: WEN_FUNC, req: Build5Request<any>): Observable<T | undefined> {
    const origin = environment.production ? BUILD5_PROD_ADDRESS_API : BUILD5_TEST_ADDRESS_API;
    console.log('base.api request - origin: ', origin);
    return <any>this.httpClient.post(origin + func, req);
  }
}
