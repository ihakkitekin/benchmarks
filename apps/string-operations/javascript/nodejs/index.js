const http = require('http');
const url = require('url');

const server = http.createServer();

const STATIC_STRING = '0 12 -5 123 -18 5 -6 1 -1234 lorem 423 -ipsum';
const STATIC_REGEXP = new RegExp('-[1-9]\\d*', 'g');

const STATIC_STRING_TIME = 'Current time $time';
const STATIC_REGEXP_TIME = new RegExp('\\$time', 'g');

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

function stringReplace(req, res) {
  res.setHeader('Server', 'NodeJS');

  const date = new Date();
  var dateString =
    date.getUTCFullYear() +
    '/' +
    ('0' + (date.getUTCMonth() + 1)).slice(-2) +
    '/' +
    ('0' + date.getUTCDate()).slice(-2) +
    ' ' +
    ('0' + date.getUTCHours()).slice(-2) +
    ':' +
    ('0' + date.getUTCMinutes()).slice(-2) +
    ':' +
    ('0' + date.getUTCSeconds()).slice(-2);

  const response = STATIC_STRING_TIME.replace("$time", dateString);

  res.write(response);
  res.end();
}

function regexpReplace(req, res) {
  res.setHeader('Server', 'NodeJS');

  const date = new Date();
  var dateString =
    date.getUTCFullYear() +
    '/' +
    ('0' + (date.getUTCMonth() + 1)).slice(-2) +
    '/' +
    ('0' + date.getUTCDate()).slice(-2) +
    ' ' +
    ('0' + date.getUTCHours()).slice(-2) +
    ':' +
    ('0' + date.getUTCMinutes()).slice(-2) +
    ':' +
    ('0' + date.getUTCSeconds()).slice(-2);

  const response = STATIC_STRING_TIME.replace(STATIC_REGEXP_TIME, dateString);

  res.write(response);
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

  if (reqUrl.pathname === '/string-replace') {
    return stringReplace(req, res);
  }

  if (reqUrl.pathname === '/regexp-replace') {
    return regexpReplace(req, res);
  }

  return notFound(req, res);
});

server.listen(8080);
