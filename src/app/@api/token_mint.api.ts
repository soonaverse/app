import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  PublicCollections,
  Token,
  Transaction,
  WEN_FUNC,
  WenRequest,
} from '@build-5/interfaces';
import { Observable } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenMintApi extends BaseApi<Token> {
  constructor(protected httpClient: HttpClient) {
    super(PublicCollections.TOKEN, httpClient);
  }

  public mintToken = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.mintTokenOrder, req);

  public importToken = (req: WenRequest): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.importMintedToken, req);
}
