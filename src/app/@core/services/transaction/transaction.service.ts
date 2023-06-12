import { Injectable } from '@angular/core';
import {
  DEF_WALLET_PAY_IN_PROGRESS,
  Network,
  Transaction,
  TransactionMintCollectionType,
  TransactionMintTokenType,
  TransactionType,
} from '@build-5/interfaces';

@Injectable({
  providedIn: 'root',
})
export class TransactionService {
  public getTitle(t: Transaction): string {
    if (t.type === TransactionType.BILL_PAYMENT) {
      if (!t.payload.royalty) {
        return $localize`Bill Payment`;
      } else {
        return $localize`Bill (royalty)`;
      }
    } else if (
      t.type === TransactionType.CREDIT ||
      t.type === TransactionType.CREDIT_TANGLE_REQUEST
    ) {
      return $localize`Credit`;
    } else if (t.type === TransactionType.PAYMENT) {
      return $localize`Payment`;
    } else if (t.type === TransactionType.CREDIT_NFT) {
      return $localize`Credit NFT`;
    } else if (t.type === TransactionType.MINT_COLLECTION) {
      return $localize`Mint Collection` + this.getMintedSubtypesText(t);
    } else if (t.type === TransactionType.MINT_TOKEN) {
      return $localize`Mint Token` + this.getMintedSubtypesText(t);
    } else if (t.type === TransactionType.WITHDRAW_NFT) {
      return $localize`Withdraw Asset`;
    } else if (t.type === TransactionType.UNLOCK) {
      return $localize`Unlock`;
    } else if (t.type === TransactionType.VOTE) {
      return $localize`Vote`;
    } else {
      return $localize`Order`;
    }
  }

  public getMintedSubtypesText(t: Transaction): string {
    let base = '';
    if (t.payload.type === TransactionMintCollectionType.MINT_ALIAS) {
      base += ' ' + $localize`(Mint Alias)`;
    } else if (t.payload.type === TransactionMintCollectionType.MINT_NFTS) {
      base += ' ' + $localize`(Mint NFTs)`;
    } else if (t.payload.type === TransactionMintTokenType.MINT_FOUNDRY) {
      base += ' ' + $localize`(Mint Foundry)`;
    } else if (t.payload.type === TransactionMintCollectionType.SEND_ALIAS_TO_GUARDIAN) {
      base += ' ' + $localize`(Send Alias to Guardian)`;
    } else if (t.payload.type === TransactionMintCollectionType.LOCK_COLLECTION) {
      base += ' ' + $localize`(Lock Collection)`;
    }

    return base;
  }

  public getExplorerLink(t?: Transaction): string | null {
    if (!t) return null;
    if (this.paymentNotProcessedOrInProgress(t)) return null;
    const link = t.payload.chainReference || t.payload?.walletReference?.chainReference;

    return this.generateLink(link, t.network);
  }

  public generateLink(link: string, network?: Network): string {
    switch (network) {
      case Network.RMS:
        return 'https://explorer.shimmer.network/testnet/search/' + link;
      case Network.SMR:
        return 'https://explorer.shimmer.network/shimmer/search/' + link;
      case Network.ATOI:
        return 'https://explorer.iota.org/devnet/search/' + link;
      case Network.IOTA:
      default:
        return 'https://explorer.iota.org/mainnet/search/' + link;
    }
  }

  public paymentNotProcessedOrInProgress(tran: Transaction | undefined | null): boolean {
    return (
      (!tran?.payload.chainReference && !tran?.payload.walletReference?.chainReference) ||
      tran.payload.walletReference?.chainReference.startsWith(DEF_WALLET_PAY_IN_PROGRESS)
    );
  }
}
