/* eslint-disable camelcase */
import { en_GB } from 'ng-zorro-antd/i18n';

// es_ES,
// fr_FR,
// it_IT,
// ko_KR,
// nl_NL,
// zh_CN
// de_DE,

export interface LanguagesType {
  [key: string]: {
    ngZorro: any;
    title: string;
    remoteHosting: string;
  };
}

export const Languages: LanguagesType = {
  en: {
    ngZorro: en_GB,
    title: 'EN',
    remoteHosting: 'en',
  },
  // de: {
  //   ngZorro: de_DE,
  //   title: 'DE',
  //   remoteHosting: 'de',
  // },
  // es: {
  //   ngZorro: es_ES,
  //   title: 'ES',
  //   remoteHosting: 'es',
  // },
  // fr: {
  //   ngZorro: fr_FR,
  //   title: 'FR',
  //   remoteHosting: 'fr',
  // },
  // it: {
  //   ngZorro: it_IT,
  //   title: 'IT',
  //   remoteHosting: 'it',
  // },
  // ko: {
  //   ngZorro: ko_KR,
  //   title: 'KO',
  //   remoteHosting: 'ko',
  // },
  // nl: {
  //   ngZorro: nl_NL,
  //   title: 'NL',
  //   remoteHosting: 'nl',
  // },
  // zh_cn: {
  //   ngZorro: zh_CN,
  //   title: '简中',
  //   remoteHosting: 'cn',
  // }
};
