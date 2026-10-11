const { handleBinanceRequest } = require('../../../server/binance-proxy.cjs');

module.exports = async function handler(request, response) {
  const handled = await handleBinanceRequest(request, response);
  if (!handled) {
    response.statusCode = 404;
    response.end();
  }
};
