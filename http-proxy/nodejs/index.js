const http = require('http');
const proxy = require('http2-proxy');
const finalhandler = require('finalhandler');

const defaultWebHandler = (err, req, res) => {
  if (err) {
    console.error('proxy error', err);
    finalhandler(req, res)(err);
  }
};

const server = http.createServer();

server.on('request', (req, res) => {
  res.setHeader('x-powered-by', 'nodejs');

  proxy.web(
    req,
    res,
    {
      hostname: process.env.PROXY_URL,
    },
    defaultWebHandler,
  );
});

server.listen(8080);
