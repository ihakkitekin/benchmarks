const http = require('http');
const url = require('url');

const server = http.createServer();

function helloWorld(req, res) {
  res.setHeader('Server', 'NodeJS');
  res.write('Hello, world!');

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

  if(reqUrl.pathname === '/hello-world'){
    return helloWorld(req, res);
  }

  return notFound(req, res);
});

server.listen(8080);
