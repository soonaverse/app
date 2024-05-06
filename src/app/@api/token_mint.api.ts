import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import {
  Dataset,
  Token,
  Transaction,
  WEN_FUNC,
  BuildcoreRequest,
  TokenMintRequest,
  ImportMintedTokenRequest,
} from '@buildcore/interfaces';
import { Observable } from 'rxjs';
import { BaseApi } from './base.api';

@Injectable({
  providedIn: 'root',
})
export class TokenMintApi extends BaseApi<Token> {
  constructor(protected httpClient: HttpClient) {
    super(Dataset.TOKEN, httpClient);
  }

  public mintToken = (req: BuildcoreRequest<TokenMintRequest>): Observable<Transaction | undefined> =>
    this.request(WEN_FUNC.mintTokenOrder, req);

  public importToken = (
    req: BuildcoreRequest<ImportMintedTokenRequest>,
  ): Observable<Transaction | undefined> => this.request(WEN_FUNC.importMintedToken, req);
}
