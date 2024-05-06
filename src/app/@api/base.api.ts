import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  NetworkAddress,
  BUILDCORE_PROD_ADDRESS_API,
  BUILDCORE_TEST_ADDRESS_API,
  WEN_FUNC,
  BuildcoreRequest,
  Dataset,
} from '@buildcore/interfaces';
import { https, Buildcore, SoonaverseApiKey } from '@buildcore/sdk';
import { Observable, of } from 'rxjs';

export const DEFAULT_LIST_SIZE = 50;
export const WHERE_IN_BATCH = 10;
export const FULL_LIST = 10000;
// TODO Migrations that should happen.
export const FULL_TODO_CHANGE_TO_PAGING = FULL_LIST;
export const FULL_TODO_MOVE_TO_PROTOCOL = FULL_LIST;

export const ORIGIN = environment.production ? Buildcore.PROD : Buildcore.TEST;
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

  protected request<T>(func: WEN_FUNC, req: BuildcoreRequest<any>): Observable<T | undefined> {
    const origin = environment.production ? BUILDCORE_PROD_ADDRESS_API : BUILDCORE_TEST_ADDRESS_API;
    return <any>this.httpClient.post(origin + func, req);
  }
}
