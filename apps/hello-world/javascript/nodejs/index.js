const http = require('http');

const server = http.createServer();

function helloWorld(req, res) {
  res.setHeader('Server', 'NodeJS');

  res.write('Hello, world!');
  res.end();
}

server.on('request', (req, res) => {
  helloWorld(req, res);
});

server.listen(8080);
