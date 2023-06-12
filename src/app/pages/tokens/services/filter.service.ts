import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Needs to be implemented
@Injectable({
  providedIn: 'any',
})
export class FilterService {
  public search$: BehaviorSubject<string | undefined> = new BehaviorSubject<string | undefined>(
    undefined,
  );
}
