import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  Token,
  Transaction,
  WEN_FUNC,
  Build5Request,
  TokenMintRequest,
  ImportMintedTokenRequest,
} from '@build-5/interfaces';
import { Observable } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenMintApi extends BaseApi<Token> {
  constructor(protected httpClient: HttpClient) {
    super(Dataset.TOKEN, httpClient);
  }

  public mintToken = (req: Build5Request<TokenMintRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.mintTokenOrder, req);

  public importToken = (
    req: Build5Request<ImportMintedTokenRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.importMintedToken, req);
}
