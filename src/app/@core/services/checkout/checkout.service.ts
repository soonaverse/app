import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  public modalOpen$ = new BehaviorSubject<boolean>(false);
}
