import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NftSelectionService {
  private selectedNftIdsSubject = new BehaviorSubject<string[]>([]);
  selectedNftIds$ = this.selectedNftIdsSubject.asObservable();
  private modalClosedSource = new Subject<void>();
  public modalClosed$ = this.modalClosedSource.asObservable();

  public selectNft(nftId: string) {
    const currentSelectedNftIds = this.selectedNftIdsSubject.getValue();
    if (!currentSelectedNftIds.includes(nftId)) {
      this.selectedNftIdsSubject.next([...currentSelectedNftIds, nftId]);
    }
  }

  public deselectNft(nftId: string) {
    const updatedSelectedNftIds = this.selectedNftIdsSubject
      .getValue()
      .filter((id) => id !== nftId);
    this.selectedNftIdsSubject.next(updatedSelectedNftIds);
  }

  public clearSelection() {
    this.selectedNftIdsSubject.next([]);
  }

  public notifyModalClosed(): void {
    this.modalClosedSource.next();
  }
}
