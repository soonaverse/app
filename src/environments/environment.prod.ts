import { MIN_IOTA_AMOUNT } from '@buildcore/interfaces';

export const environment = {
  production: true,
  algolia: {
    appId: '2WGM1RPQKZ',
    key: 'ed51a01fc204688339e89ac8e9d53028',
  },
  soonaversePlaceholder: 'https://soonaverse.com/favicon.ico',
  buildcoreToken:
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1aWQiOiIweDU1MWZkMmM3YzdiZjM1NmJhYzE5NDU4N2RhYjJmY2Q0NjQyMDA1NGIiLCJwcm9qZWN0IjoiMHg0NjIyM2VkZDQxNTc2MzVkZmM2Mzk5MTU1NjA5ZjMwMWRlY2JmZDg4IiwiaWF0IjoxNzAwMDAyODkwfQ.IYZvBRuCiN0uYORKnVJ0SzT_1H_2o5xyDBG20VmnTQ0',
  tiers: [0, 10, 4000, 6000, 15000].map((v) => v * MIN_IOTA_AMOUNT),
};
