const http = require('http');
const url = require('url');

const server = http.createServer();

const STATIC_STRING = '0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum';
const STATIC_REGEXP = new RegExp('-[1-9]\\d*', 'g');

function staticRegexp(req, res) {
  let match = null;

  res.setHeader('Server', 'NodeJS');

  do {
    match = STATIC_REGEXP.exec(STATIC_STRING);

    if (match) {
      res.write(match[0]);
      res.write('\n');
    }
  } while (match);

  res.end();
}

function dynamicRegexp(req, res) {
  const rg = new RegExp('-[1-9]\\d*', 'g');
  let match = null;

  res.setHeader('Server', 'NodeJS');

  do {
    match = rg.exec(STATIC_STRING);

    if (match) {
      res.write(match[0]);
      res.write('\n');
    }
  } while (match);

  res.end();
}

function notFound(req, res) {
  res.statusCode = 404;
  res.setHeader('Server', 'NodeJS');
  res.write('Not Found.');

  res.end();
}

server.on('request', (req, res) => {
  const reqUrl = url.parse(req.url);

  if (reqUrl.pathname === '/static-regexp') {
    return staticRegexp(req, res);
  }

  if (reqUrl.pathname === '/dynamic-regexp') {
    return dynamicRegexp(req, res);
  }

  return notFound(req, res);
});

server.listen(8080);
