const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const { handleBinanceRequest } = require('./server/binance-proxy.cjs');

const config = getDefaultConfig(__dirname);
const privyEntry = require.resolve('@privy-io/expo');
const privyCoreEntry = require.resolve('@privy-io/js-sdk-core', {
  paths: [path.dirname(privyEntry)],
});
const josePackage = require.resolve('jose/package.json', {
  paths: [path.dirname(privyCoreEntry)],
});
const joseBrowserEntry = path.join(path.dirname(josePackage), 'dist/browser/index.js');
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'jose') {
    return { type: 'sourceFile', filePath: joseBrowserEntry };
  }
  return context.resolveRequest(context, moduleName, platform);
};

const enhanceMiddleware = config.server.enhanceMiddleware;

config.server.enhanceMiddleware = (middleware, server) => {
  const metroMiddleware = enhanceMiddleware
    ? enhanceMiddleware(middleware, server)
    : middleware;

  return (request, response, next) => {
    if (request.url?.startsWith('/api/binance/')) {
      handleBinanceRequest(request, response)
        .then((handled) => { if (!handled) next(); })
        .catch(() => {
          if (!response.headersSent) {
            response.writeHead(502, { 'content-type': 'application/json; charset=utf-8' });
            response.end(JSON.stringify({ error: 'Binance market data is unavailable.' }));
          }
        });
      return;
    }
    metroMiddleware(request, response, next);
  };
};

module.exports = config;
