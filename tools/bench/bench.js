const autocannon = require('autocannon');
const { text, print } = require('../text');
const {
  mapRoundResult
} = require('../result/result');
const mainConfig = require('./bench.config.json');

async function bench(framework, round, path) {
  print('Running ... ');
  const results = await autocannon({
    url: `http://localhost:${framework.port}${path}`,
    connections: mainConfig.connections,
    duration: mainConfig.duration,
  });
  console.log(text.green('done'));

  const res = mapRoundResult(results);

  if (mainConfig.roundByRoundResults) {
    print(`\nRound ${round} results:\n`, JSON.stringify(res, null, 2), '\n');
  }

  return res;
}

async function warmUp(framework, path) {
  print('Warming up ... ');
  await autocannon({
    url: `http://localhost:${framework.port}${path}`,
    connections: 10,
    duration: 10,
  });
  console.log(text.green('done'));
}

module.exports.warmUp = warmUp;
module.exports.bench = bench;
