const autocannon = require('autocannon');
const { execSync } = require('child_process');
const path = require('path');

const targetBench = process.argv[2];
const configPath = `./${targetBench}/bench.config.json`;
const config = require(configPath);
const execOptions = {
  cwd: path.join(__dirname, targetBench),
};

const colors = {
  Black: '\x1b[30m',
  Red: '\x1b[31m',
  Green: '\x1b[32m',
  Yellow: '\x1b[33m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
  Cyan: '\x1b[36m',
  White: '\x1b[37m',
  Reset: '\x1b[0m',
};

const benchResults = {};

async function bench(app, requests, round) {
  const results = await autocannon({
    requests,
    url: app.url,
    connections: config.connections,
    duration: config.duration,
  });

  const res = {
    totalRequests: results.requests.sent,
    rps: results.requests.average,
    averageLatency: results.latency.average,
    errors: results.errors,
    timeouts: results.timeouts,
  };

  console.log(
    `\nRound ${round} results:\n`,
    JSON.stringify(res, null, 4),
    '\n',
  );

  const appResult = benchResults[app.name];

  if (appResult) {
    appResult.push(res);
  } else {
    benchResults[app.name] = [res];
  }
}

async function warmUp(app, requests) {
  await autocannon({
    requests,
    url: app.url,
    connections: 10,
    duration: 10,
  });
}

function textWithColor(text, color) {
  return `${color}${text}${colors.Reset}`;
}

async function run(app, requests) {
  const container = app.name;

  for (let i = 0; i < config.rounds; i++) {
    const round = i + 1;

    console.log(
      textWithColor('\nStarting benchmark test for:', colors.Yellow),
      textWithColor(app.name, colors.Magenta),
      textWithColor('Round:', colors.Yellow),
      textWithColor(round, colors.Green),
      '\n',
    );

    execSync(`docker-compose start ${container}`, execOptions);

    process.stdout.write('Warming up ... ');
    await warmUp(app, requests);

    process.stdout.write(textWithColor('done\n', colors.Green));
    console.log('Starting benchmark ...');
    await bench(app, requests, round);

    execSync(`docker-compose stop ${container}`, execOptions);
  }
}

async function init() {
  console.log('Building containers...\n');
  execSync('docker-compose build && docker-compose up --no-start', execOptions);

  console.log('Stopping containers if already running...\n');
  execSync(`docker-compose stop`, execOptions);

  const hasPaths = Array.isArray(config.paths) && config.paths.length > 0;
  const requests = hasPaths
    ? config.map(path => {
        return { path };
      })
    : undefined;

  for (let i = 0; i < config.apps.length; i++) {
    const app = config.apps[i];
    await run(app, requests);
  }

  const conditions = [
    {
      durationEach: config.duration,
      rounds: config.rounds,
      connections: config.connections,
    },
  ];

  const finalResults = [];

  for (let i = 0; i < config.apps.length; i++) {
    const app = config.apps[i].name;
    const appResults = benchResults[app];
    const total = appResults.reduce((a, b) => {
      return {
        totalRequests: a.totalRequests + b.totalRequests,
        rps: a.rps + b.rps,
        averageLatency: a.averageLatency + b.averageLatency,
        errors: a.errors + b.errors,
        timeouts: a.timeouts + b.timeouts,
      };
    });

    const results = {
      app,
      totalRequests: total.totalRequests,
      totalErrors: total.errors,
      totalTimeouts: total.timeouts,
      averageLatency: (total.averageLatency / appResults.length).toFixed(2),
      averageRequests: (total.totalRequests / appResults.length).toFixed(2),
      averageRps: (total.rps / appResults.length).toFixed(2),
    };

    finalResults.push(results);
  }

  console.table(conditions);
  console.table(finalResults);
}

init();