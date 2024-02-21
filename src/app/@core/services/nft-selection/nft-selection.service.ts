import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NftSelectionService {
  private selectedNftIdsSubject = new BehaviorSubject<string[]>([]);
  selectedNftIds$ = this.selectedNftIdsSubject.asObservable();

  public selectNft(nftId: string) {
    //console.log('nft-selection.service deselectNft - initial nfts: ', this.selectedNftIdsSubject.getValue());
    const currentSelectedNftIds = this.selectedNftIdsSubject.getValue();
    if (!currentSelectedNftIds.includes(nftId)) {
      //console.log('nft-selection.service deselectNft - selected nfts missing this nft, adding this nft: ', nftId);
      this.selectedNftIdsSubject.next([...currentSelectedNftIds, nftId]);
    }
    //console.log('nft-selection.service deselectNft - ending nfts: ', this.selectedNftIdsSubject.getValue());
  }

  public deselectNft(nftId: string) {
    //console.log('nft-selection.service deselectNft - initial nfts: ', this.selectedNftIdsSubject.getValue());
    const updatedSelectedNftIds = this.selectedNftIdsSubject.getValue().filter(id => id !== nftId);
    this.selectedNftIdsSubject.next(updatedSelectedNftIds);
    //console.log('nft-selection.service deselectNft - ending nfts: ', updatedSelectedNftIds);
  }

  public clearSelection() {
    //console.log('nft-selection.service clearSelection fired.');
    this.selectedNftIdsSubject.next([]);
  }
}
