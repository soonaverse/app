import { MIN_IOTA_AMOUNT } from '@build-5/interfaces';

export const environment = {
  production: true,
  algolia: {
    appId: '2WGM1RPQKZ',
    key: 'ed51a01fc204688339e89ac8e9d53028',
  },
  soonaversePlaceholder: 'https://soonaverse.com/favicon.ico',
  build5Token: '',
  tiers: [0, 10, 4000, 6000, 15000].map((v) => v * MIN_IOTA_AMOUNT),
};
