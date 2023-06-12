import 'localstorage-polyfill';
import 'zone.js/dist/zone-node';

import { APP_BASE_HREF } from '@angular/common';
import { ngExpressEngine } from '@nguniversal/express-engine';
import * as express from 'express';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { AppServerModule } from './src/main.server';

import * as domino from 'domino';

const distFolder = join(process.cwd(), 'dist/soonaverse');
const template = readFileSync(join(distFolder, 'index.html')).toString();
const win = domino.createWindow(template.toString());
(global as any).window = win;
global['document'] = win.document;
(global as any).self = win;
global['document'] = win.document;
global['navigator'] = win.navigator;
global['getComputedStyle'] = win.getComputedStyle;

global['localStorage'] = localStorage;

// eslint-disable-next-line @typescript-eslint/no-empty-function
const mock = () => {};
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: any) => {
    return {
      matches: false,
      media: query,
      onchange: null,
      addListener: mock, // deprecated
      removeListener: mock, // deprecated
      addEventListener: mock,
      removeEventListener: mock,
      dispatchEvent: mock,
    };
  },
});

// The Express app is exported so that it can be used by serverless Functions.
export function app(): express.Express {
  const server = express();
  const distFolder = join(process.cwd(), 'dist/soonaverse');
  const indexHtml = existsSync(join(distFolder, 'index.original.html'))
    ? 'index.original.html'
    : 'index';

  // Our Universal express-engine (found @ https://github.com/angular/universal/tree/main/modules/express-engine)
  server.engine(
    'html',
    ngExpressEngine({
      bootstrap: AppServerModule,
    }),
  );

  server.set('view engine', 'html');
  server.set('views', distFolder);

  // Serve static files from /browser
  server.get(
    '*.*',
    <any>express.static(distFolder, <any>{
      maxAge: '1y',
    }),
  );

  // All regular routes use the Universal engine
  server.get('*', (req, res) => {
    console.log('Request: ', req.originalUrl);
    res.render(
      indexHtml,
      {
        req,
        providers: [{ provide: APP_BASE_HREF, useValue: req.baseUrl }],
      },
      (err, html) => {
        if (err) {
          console.error(err);
          res.send(err);
        } else {
          console.log('Received', req.originalUrl);
          res.send(html);
        }
      },
    );
  });

  return server;
}

function run(): void {
  const port = process.env['PORT'] || 4000;

  // Start up the Node server
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

// Webpack will replace 'require' with '__webpack_require__'
// '__non_webpack_require__' is a proxy to Node 'require'
// The below code is to ensure that the server is run only when not requiring the bundle.
// declare const __non_webpack_require__: NodeRequire;
// const mainModule = __non_webpack_require__.main;
// const moduleFilename = mainModule && mainModule.filename || '';
// if (moduleFilename === __filename || moduleFilename.includes('iisnode')) {
//   run();
// }

run();
export * from './src/main.server';
