import { createNullCache } from '@algolia/cache-common';
import { Injectable } from '@angular/core';
import { RefinementMappings } from '@components/algolia/refinement/refinement.component';
import { enumToArray } from '@core/utils/manipulations.utils';
import { environment } from '@env/environment';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Access, Categories, NftAvailable, CollectionStatus } from '@buildcore/interfaces';
import algoliasearch from 'algoliasearch/lite';

const accessMapping: RefinementMappings = {};

@UntilDestroy()
@Injectable({
  providedIn: 'root',
})
export class AlgoliaService {
  public readonly searchClient = algoliasearch(environment.algolia.appId, environment.algolia.key, {
    responsesCache: createNullCache(),
    // requestsCache: createNullCache(),
  });

  constructor() {
    Object.values(Access).forEach((value, index) => {
      if (typeof value === 'string') {
        accessMapping['' + index] = value;
      }
    });
  }

  public fetchAllOwnedNfts(memberId: string, indexName: string): Promise<any[]> {
    const index = this.searchClient.initIndex(indexName);
    let page = 0;
    const hitsPerPage = 20;
    const allHits: any[] = [];

    return new Promise((resolve, reject) => {
      const fetchPage = () => {
        index
          .search('', {
            filters: `owner:${memberId}`,
            hitsPerPage,
            page,
          })
          .then((response) => {
            allHits.push(...response.hits);
            if (page < response.nbPages - 1) {
              page++;
              fetchPage();
            } else {
              resolve(allHits);
            }
          })
          .catch(reject);
      };

      fetchPage();
    });
  }

  public convertToAccessName(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => {
      let label = $localize`Open`;
      if (Number(algolia.value) === Access.GUARDIANS_ONLY) {
        label = $localize`Guardians of Space Only`;
      } else if (Number(algolia.value) === Access.MEMBERS_ONLY) {
        label = $localize`Members of Space Only`;
      } else if (Number(algolia.value) === Access.MEMBERS_WITH_BADGE) {
        label = $localize`Members With Badge Only`;
      } else if (Number(algolia.value) === Access.MEMBERS_WITH_NFT_FROM_COLLECTION) {
        label = $localize`Members With NFT only`;
      }

      return {
        ...algolia,
        label: label,
        highlighted: label,
      };
    });
  }

  public convertNftAvailable(algoliaItems: any[]) {
    return algoliaItems.map((algolia) => {
      let label = $localize`Unavailable for sale`;
      if (Number(algolia.value) === NftAvailable.AUCTION) {
        label = $localize`On Auction`;
      } else if (Number(algolia.value) === NftAvailable.AUCTION_AND_SALE) {
        label = $localize`Available`;
      } else if (Number(algolia.value) === NftAvailable.SALE) {
        label = $localize`On Sale`;
      }

      return {
        ...algolia,
        label: label,
        highlighted: label,
      };
    });
  }

  public convertCollectionCategory(algoliaItems: any[]) {
    const categories = enumToArray(Categories);
    return algoliaItems.map((algolia) => {
      const label = categories.find((category) => category.key === algolia.value)?.value;
      return {
        ...algolia,
        label: label,
        highlighted: label,
      };
    });
  }

  public convertCollectionStatus(algoliaItems: any[]) {
    const statuses = enumToArray(CollectionStatus);
    return algoliaItems.map((algolia) => {
      const label = statuses.find((status) => status.key === algolia.value)?.value;
      return {
        ...algolia,
        label: label,
        highlighted: label,
      };
    });
  }
}
