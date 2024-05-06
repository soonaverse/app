import { URL_PATHS } from '@buildcore/interfaces';

export const ROUTER_UTILS = {
  config: {
    base: {
      home: '',
      dashboard: 'dashboard',
    },
    auth: {
      root: 'auth',
      signIn: 'signIn',
    },
    market: {
      root: 'market',
      collections: 'collections',
      nfts: 'nfts',
    },
    tokens: {
      root: 'tokens',
      favourites: 'favourites',
      allTokens: 'all',
      tradingPairs: 'trading',
      launchpad: 'launchpad',
    },
    discover: {
      root: 'discover',
      spaces: 'spaces',
      awards: 'awards',
      proposals: 'proposals',
      members: 'members',
    },
    swap: {
      root: 'swap',
    },
    farming: {
      farming: 'farming',
    },
    soonStaking: {
      root: 'soon-staking',
    },
    member: {
      // Redirect back to discovery
      root: URL_PATHS.MEMBER,
      member: ':memberId',
      activity: 'activity',
      awards: 'awards',
      badges: 'badges',
      spaces: 'spaces',
      nfts: 'nfts',
      tokens: 'tokens',
      transactions: 'transactions',
      staking: 'staking',
    },
    space: {
      // Redirect back to discovery
      root: URL_PATHS.SPACE,
      space: ':spaceId',
      new: 'new',
      edit: 'edit',
      manage: 'manage',
      overview: 'overview',
      proposals: 'proposals',
      awards: 'awards',
      staking: 'staking',
      members: 'members',
      collections: 'collections',
    },
    proposal: {
      // Redirect back to space?!
      root: URL_PATHS.PROPOSAL,
      newProposal: 'new',
      proposal: ':proposalId',
      overview: 'overview',
      votes: 'votes',
      participants: 'participants',
    },
    award: {
      // Redirect back to space?!
      root: URL_PATHS.AWARD,
      newAward: 'new',
      award: ':awardId',
      overview: 'overview',
      participants: 'participants',
    },
    collection: {
      root: URL_PATHS.COLLECTION,
      collection: ':collectionId',
      new: 'new',
      edit: 'edit',
    },
    nft: {
      root: URL_PATHS.NFT,
      newNft: 'new',
      nft: ':nftId',
      single: 'single',
      multiple: 'multiple',
      notFound: 'not-found',
    },
    token: {
      root: URL_PATHS.TOKEN,
      newToken: 'new',
      token: ':tokenId',
      overview: 'overview',
      metrics: 'metrics',
      airdrops: 'airdrops',
      trade: 'trade',
    },
    errorResponse: {
      notFound: '404',
    },
    about: {
      root: 'about',
    },
  },
};
