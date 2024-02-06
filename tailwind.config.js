const fs = require('fs');
const lessToJs = require('less-vars-to-js');
const { kebabCase, mapKeys } = require('lodash');

const lessOptions = {
  resolveVariables: true,
  stripPrefix: true,
};

const lightThemeLess = fs.readFileSync('src/theme/light.less').toString();
const lightTheme = lessToJs(lightThemeLess, lessOptions);

const darkThemeLess = fs.readFileSync('src/theme/dark.less').toString();
const darkTheme = lessToJs(darkThemeLess, lessOptions);

const normalizeNames = (theme) => mapKeys(theme, (_, name) => kebabCase(name));

module.exports = {
  prefix: '',
  content: ['./src/**/*.{html,ts}', './projects/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    fontFamily: {
      display: ['Poppins', 'sans-serif'],
    },
    container: {
      center: true,
    },
    extend: {
      colors: {
        inherit: 'inherit',
        // Modern definition - shared with less variables used in ng-zorro
        ...normalizeNames(lightTheme),
        ...normalizeNames(darkTheme),
      },
      screens: {
        xs: '314px',
        '2xl': '1440px',
        '3xl': '1680px',
        '4xl': '1920px',
        'h-break': { raw: '(max-height: 830px)' },
      },
      spacing: {
        18: '4.5rem',
        30: '7.5rem',
        75: '18.75rem',
        420: '420px',
      },
      minWidth: {
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        12: '3rem',
        24: '6rem',
        30: '7.5rem',
        32: '8rem',
        40: '10rem',
        60: '15rem',
        76: '19rem',
        100: '25rem',
        120: '30rem',
      },
      maxWidth: {
        fit: 'fit-content',
        20: '5rem',
        24: '6rem',
        40: '10rem',
        80: '20rem',
        128: '32rem',
        160: '40rem',
        '1/2': '50%',
        '1/3': '33%',
        '2/3': '66%',
        450: '450px',
        1136: '1136px',
        1296: '1296px',
        1776: '1776px',
      },
      width: {
        header: '500px',
        76: '19rem',
        '3/10': '30%',
      },
      minHeight: {
        6: '1.5rem',
        8: '2rem',
        10: '2.5rem',
        14: '3.5rem',
        20: '5rem',
        24: '6rem',
        76: '19rem',
        180: '45rem',
      },
      maxHeight: {
        56: '14rem',
        80: '20rem',
        128: '32rem',
      },
      height: {
        76: '19rem',
        99: '24.75rem',
      },
      borderRadius: {
        9: '2.25rem',
        10: '2.5rem',
        large: '3rem',
        40: '10rem',
      },
      borderWidth: {
        3: '3px',
      },
      dropShadow: {
        card: '0px 0px 12px rgba(0, 0, 0, 0.08)',
      },
      boxShadow: {
        header: '0px 2px 3px #E6E5DE',
        modal: '0px 2px 32px rgba(0, 0, 0, 0.16)',
      },
      fontSize: {
        xxs: '0.625rem',
      },
      flex: {
        2: '2 2 0%',
      },
    },
  },
  plugins: [require('@tailwindcss/line-clamp')],
};
