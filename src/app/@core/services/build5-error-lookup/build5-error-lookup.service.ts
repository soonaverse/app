import { Injectable } from '@angular/core';
import { WenError } from '@build-5/interfaces';
import { AuthService } from '@components/auth/services/auth.service';

@Injectable({
  providedIn: 'root',
})
export class Build5ErrorLookupService {
  constructor(
    public auth: AuthService,
  ) {

  }

  public getErrorMessage(errorCode: number): string {
    // Convert WenError object to an array and find the entry by error code
    const errorEntry = Object.values(WenError).find((entry) => entry.code === errorCode);
    return errorEntry ? errorEntry.key : 'Unknown error';
  }
}
