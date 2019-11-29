const autocannon = require('autocannon');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const { text, print } = require('./tools/textTools');

const targetBench = process.argv[2];
const benchConfigPath = `./${targetBench}/bench.config.json`;
const mainConfig = require('./bench.config.json');
const benchConfig = require(benchConfigPath);

const config = { ...mainConfig, ...benchConfig };
const execOptions = {
  cwd: path.join(__dirname, targetBench),
};

const benchResults = [];

async function bench(app, round) {
  const results = await autocannon({
    url: app.url,
    connections: config.connections,
    duration: config.duration,
  });

  const res = {
    round,
    totalRequests: results.requests.sent,
    rps: results.requests.average,
    averageLatency: results.latency.average,
    errors: results.errors,
    timeouts: results.timeouts,
  };

  if (config.roundByRoundResults) {
    print(`\nRound ${round} results:\n`, JSON.stringify(res, null, 2), '\n');
  }

  const benchApp = benchResults.find(res => res.name === app.name);

  if (benchApp) {
    benchApp.results.push(res);
  } else {
    benchResults.push({
      name: app.name,
      results: [res],
    });
  }
}

async function warmUp(app) {
  await autocannon({
    url: app.url,
    connections: 10,
    duration: 10,
  });
}

async function run(app) {
  const container = app.name;

  console.log(
    text.yellow('\nStarting benchmark test for:'),
    text.magenta(`${app.name}\n`),
  );

  for (let i = 0; i < config.rounds; i++) {
    const round = i + 1;

    console.log(text.yellow('Round:'), text.green(round));

    execSync(`docker-compose start ${container}`, execOptions);

    if (config.warmUp) {
      print('Warming up ... ');
      await warmUp(app);
      console.log(text.green('done'));
    }

    print('Running ... ');
    await bench(app, round);
    console.log(text.green('done'));

    execSync(`docker-compose stop ${container}`, execOptions);

    await cooldown(10000);
  }
}

async function runAll() {
  console.log('Stopping containers if already running ...\n');
  execSync(`docker-compose down`, execOptions);

  console.log('\nBuilding containers ...\n');
  execSync('docker-compose build && docker-compose up --no-start', execOptions);

  for (let i = 0; i < config.apps.length; i++) {
    const app = config.apps[i];
    try {
      await run(app);
    } catch (error) {
      console.error(error);
    }
  }

  console.log('\nStopping all containers ...');
  execSync(`docker-compose down`, execOptions);

  const conditions = {
    benchMark: targetBench,
    durationEach: config.duration,
    rounds: config.rounds,
    connections: config.connections,
  };

  const finalResults = [];

  for (let i = 0; i < config.apps.length; i++) {
    const app = config.apps[i].name;
    const benchApp = benchResults.find(res => res.name === app);
    const resultsLength = benchApp.results.length;
    const total = benchApp.results.reduce((a, b) => {
      return {
        totalRequests: a.totalRequests + b.totalRequests,
        rps: a.rps + b.rps,
        averageLatency: a.averageLatency + b.averageLatency,
        errors: a.errors + b.errors,
        timeouts: a.timeouts + b.timeouts,
      };
    });

    const result = {
      app,
      totalRequests: total.totalRequests,
      totalErrors: total.errors,
      totalTimeouts: total.timeouts,
      averageLatency: (total.averageLatency / resultsLength).toFixed(2),
      averageRequests: (total.totalRequests / resultsLength).toFixed(2),
      averageRps: (total.rps / resultsLength).toFixed(2),
    };

    finalResults.push(result);
  }

  console.table([conditions]);
  console.table(finalResults);

  const fileName = targetBench + '.result.json';

  print(`Saving results to ${fileName} ...`);
  fs.writeFileSync(
    fileName,
    JSON.stringify(
      {
        ...conditions,
        finalResults,
        roundByRound: {
          apps: benchResults,
        },
      },
      null,
      2,
    ),
  );

  console.log(text.green('done'));
}

async function init() {
  await runAll();
}

function cooldown(ms) {
  let count = (ms / 1000).toFixed(0);
  return new Promise(resolve => {
    const interval = setInterval(() => {
      count--;
      readline.cursorTo(process.stdout, 0);
      print(`Cooling down for ${count} seconds ...`);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      readline.cursorTo(process.stdout, 0);
      print(`Cooling down for ${count} seconds ... ${text.green('done\n')}`);
      resolve();
    }, ms);
  });
}

init();
