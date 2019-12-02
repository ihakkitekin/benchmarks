const http = require('http');
const proxy = require('http2-proxy');
const finalhandler = require('finalhandler');

const hostname = process.env.PROXY_URL.replace('http://', '').replace(
  'https://',
  '',
);

const defaultWebHandler = (err, req, res) => {
  if (err) {
    console.error('proxy error', err);
    finalhandler(req, res)(err);
  }
};

const server = http.createServer();

server.on('request', (req, res) => {
  res.setHeader('Server', 'NodeJS');

  proxy.web(
    req,
    res,
    {
      hostname,
    },
    defaultWebHandler,
  );
});

server.listen(8080);
