const http = require('http');

const server = http.createServer();

server.on('request', (req, res) => {
  res.setHeader('Server', 'NodeJS');

  res.write('Hello, world!');
  res.end();
});

server.listen(8080);
