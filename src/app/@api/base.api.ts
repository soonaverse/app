import { HttpClient } from '@angular/common/http';
import { environment } from '@env/environment';
import {
  NetworkAddress,
  PublicCollections,
  BUILD5_PROD_ADDRESS_API,
  BUILD5_TEST_ADDRESS_API,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import { Build5Env, CrudRepository } from '@build-5/lib';
import { Observable, map, of } from 'rxjs';

export const DEFAULT_LIST_SIZE = 50;
export const WHERE_IN_BATCH = 10;
export const FULL_LIST = 10000;
// TODO Migrations that should happen.
export const FULL_TODO_CHANGE_TO_PAGING = FULL_LIST;
export const FULL_TODO_MOVE_TO_PROTOCOL = FULL_LIST;

export const SOON_ENV = environment.production ? Build5Env.PROD : Build5Env.TEST;

export class BaseApi<T> {
  protected repo: CrudRepository<T>;

  constructor(public readonly collection: PublicCollections, protected httpClient: HttpClient) {
    this.repo = new CrudRepository(SOON_ENV, this.collection);
  }

  public listen = (id: string) => this.repo.getByIdLive(id);

  public listenMultiple = (ids: NetworkAddress[]) =>
    ids.length ? this.repo.getManyByIdLive(ids) : of([]);

  public top = (lastValue?: string, limit?: number) => this.repo.getTopLive(lastValue, limit);

  protected request<T>(func: WEN_FUNC, req: WenRequest): Observable<T | undefined> {
    const origin = environment.production ? BUILD5_PROD_ADDRESS_API : BUILD5_TEST_ADDRESS_API;
    return this.httpClient.post(origin + func, { data: req }).pipe(map((b: any) => b.data));
  }
}
