import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

export interface AuditOneAttribute {
  // Validation in progress.
  id: string;
  label: string;
  updatedOn: Date;
  requestedOn: Date;
  status: {
    label: string;
    code: number;
  };
  link: {
    url: string;
    label: string;
    adminOnly: boolean;
  };
}

export interface AuditOneResponse {
  id: string;
  status: {
    label: string;
    code: number;
  };
  isVerified: boolean;
  attributes: AuditOneAttribute[];
}

export interface AuditOneResponseMember extends AuditOneResponse {
  placeholder: void;
}

export interface AuditOneResponseSpace extends AuditOneResponse {
  membersKycStatus: AuditOneResponse[];
}

export interface AuditOneResponseCollection extends AuditOneResponse {
  placeholder: void;
}

export interface AuditOneResponseToken extends AuditOneResponse {
  placeholder: void;
}

@UntilDestroy()
@Injectable({
  providedIn: 'any',
})
export class AuditOneQueryService {
  public apiRootUrl = 'https://api.auditone.io';
  constructor(private http: HttpClient) {}
  public getMemberStatus(id: string): Promise<AuditOneResponseMember> {
    const path = this.apiRootUrl + '/getKycStatusOfMember' + '?id=' + id;
    return <Promise<AuditOneResponseMember>>firstValueFrom(
      this.http.get(path).pipe(
        map((v) => {
          return this.parseData(v);
        }),
      ),
    );
  }

  public getCollectionStatus(id: string): Promise<AuditOneResponseCollection> {
    const path = this.apiRootUrl + '/getKycStatusOfCollection' + '?id=' + id;
    return <Promise<AuditOneResponseCollection>>firstValueFrom(
      this.http.get(path).pipe(
        map((v) => {
          return this.parseData(v);
        }),
      ),
    );
  }

  public getTokenStatus(id: string): Promise<AuditOneResponseToken> {
    const path = this.apiRootUrl + '/getKycStatusOfToken' + '?id=' + id;
    return <Promise<AuditOneResponseToken>>firstValueFrom(
      this.http.get(path).pipe(
        map((v) => {
          return this.parseData(v);
        }),
      ),
    );
  }

  public getSpaceStatus(id: string): Promise<any> {
    const path = this.apiRootUrl + '/getKycStatusOfSpace' + '?id=' + id;
    return <Promise<AuditOneResponseSpace>>firstValueFrom(
      this.http.get(path).pipe(
        map((v) => {
          return this.parseData(v);
        }),
      ),
    );
  }

  public parseData(obj: any): AuditOneResponseSpace | AuditOneResponseMember {
    obj.isVerified = obj.isVerified === 'true' || obj.isVerified === true;
    return obj;
  }
}
