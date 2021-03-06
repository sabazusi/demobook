import { readFileSync } from 'fs';
// import { join } from 'path';
import * as express from 'express';
import * as bodyParser from 'body-parser';
// import * as favicon from 'serve-favicon';
import { router } from './router';
import { setup as setupBot } from './bot';

export function runServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());
  // app.use(favicon(join(__dirname, '..', 'assets', 'favicon.ico')));

  // HMR
  if (process.env.NODE_ENV !== 'production') {
    const webpack = require('webpack');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const config = require('../../webpack.client.config');
    const compiler = webpack(config);

    app.use(webpackHotMiddleware(compiler));
    app.use(
      webpackDevMiddleware(compiler, {
        publicPath: config.output.publicPath
      })
    );
  }

  router(app);
  setupBot();

  const server =
    process.env.SSL_KEY && process.env.SSL_CERT
      ? require('https').createServer(
          {
            key: readFileSync(process.env.SSL_KEY),
            cert: readFileSync(process.env.SSL_CERT)
          },
          app
        )
      : require('http').createServer(app);

  server.listen(port);

  server.on('listening', () => {
    const addr = server.address();
    const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;

    console.log(`Listening on ${bind}`);
  });

  server.on('error', (err: NodeJS.ErrnoException) => {
    if (err.syscall !== 'listen') throw err;

    const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;

    switch (err.code) {
      case 'EACCES':
        console.error(`${bind} requires elevated privileges`);
        process.exit(1);
      case 'EADDRINUSE':
        console.error(`${bind} is already in use`);
        process.exit(1);
      default:
        throw err;
    }
  });
}
