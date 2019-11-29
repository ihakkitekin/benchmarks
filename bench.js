const autocannon = require('autocannon');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const targetBench = process.argv[2];
const benchConfigPath = `./${targetBench}/bench.config.json`;
const mainConfig = require('./bench.config.json');
const benchConfig = require(benchConfigPath);

const config = { ...mainConfig, ...benchConfig };
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
    console.log(
      `\nRound ${round} results:\n`,
      JSON.stringify(res, null, 4),
      '\n',
    );
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

function textWithColor(text, color) {
  return `${color}${text}${colors.Reset}`;
}

async function run(app) {
  const container = app.name;

  console.log(
    textWithColor('\nStarting benchmark test for:', colors.Yellow),
    textWithColor(app.name, colors.Magenta),
    '\n',
  );

  for (let i = 0; i < config.rounds; i++) {
    const round = i + 1;

    console.log(
      textWithColor('Round:', colors.Yellow),
      textWithColor(round, colors.Green),
      '\n',
    );

    execSync(`docker-compose start ${container}`, execOptions);

    if (config.warmUp) {
      process.stdout.write('Warming up ... ');
      await warmUp(app);
      process.stdout.write(textWithColor('done\n', colors.Green));
    }

    process.stdout.write('Running ... ');
    await bench(app, round);
    process.stdout.write(textWithColor('done\n', colors.Green));

    execSync(`docker-compose stop ${container}`, execOptions);
    process.stdout.write('\n\n');
  }
}

async function runAll() {
  console.log('Building containers ...\n');
  execSync('docker-compose build && docker-compose up --no-start', execOptions);

  console.log('\nStopping containers if already running ...\n');
  execSync(`docker-compose stop`, execOptions);

  for (let i = 0; i < config.apps.length; i++) {
    const app = config.apps[i];
    try {
      await run(app);
    } catch (error) {
      console.error(error);
    }
  }

  const conditions = {
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

  process.stdout.write(`Saving results to ${fileName} ...`);
  fs.writeFileSync(
    fileName,
    JSON.stringify({ ...conditions, apps: benchResults }, null, 4),
  );
  process.stdout.write(textWithColor('done\n', colors.Green));
}

const retryCount = 3;
let failCount = 0;

async function init() {
  try {
    await runAll();
  } catch (error) {
    console.error(error);

    failCount++;

    if (failCount < retryCount) {
      console.error('\nRetrying running tests ...');
      init();
    }
  }
}

init();
