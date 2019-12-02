const autocannon = require('autocannon');
const { execSync } = require('child_process');
const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const readline = require('readline');
const { text, print, newStep } = require('./text');
const {
  getFrameworks: getLanguageMap,
  generateComposeFile,
} = require('./config');

const benchName = process.argv[2];
const config = require('./bench.config.json');
const source = path.join(__dirname, `../apps/${benchName}`);

const execOptions = {
  cwd: source,
};

const benchResults = [];

function setup() {
  const frameworks = getLanguageMap(source);
  generateComposeFile(frameworks, source);

  return frameworks;
}

async function bench(framework, round) {
  const results = await autocannon({
    url: `http://localhost:${framework.port}`,
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

  const resName = `${framework.language}:${framework.name}`;

  const benchResult = benchResults.find(res => res.name === resName);

  if (benchResult) {
    benchResult.results.push(res);
  } else {
    benchResults.push({
      name: resName,
      results: [res],
    });
  }
}

async function warmUp(framework) {
  await autocannon({
    url: `http://localhost:${framework.port}`,
    connections: 10,
    duration: 10,
  });
}

async function run(framework) {
  const container = `${framework.language}-${framework.name}`;

  newStep(
    'Starting benchmark test for:',
    text.magenta(`${framework.language}:${framework.name}`),
  );

  for (let i = 0; i < config.rounds; i++) {
    const round = i + 1;

    console.log(text.yellow('Round:'), text.green(round));

    execSync(`docker-compose start ${container}`, execOptions);

    if (config.warmUp) {
      print('Warming up ... ');
      await warmUp(framework);
      console.log(text.green('done'));
    }

    print('Running ... ');
    await bench(framework, round);
    console.log(text.green('done'));

    execSync(`docker-compose stop ${container}`, execOptions);

    await cooldown(10000);
  }
}

async function runAll(frameworks) {
  newStep('Stopping containers if already running ...');
  execSync(`docker-compose down`, execOptions);

  newStep('Building containers ...');
  execSync('docker-compose build && docker-compose up --no-start', execOptions);

  for (let j = 0; j < frameworks.length; j++) {
    const framework = frameworks[j];

    try {
      await run(framework);
    } catch (error) {
      console.error(error);
    }
  }

  newStep('Stopping all containers ...');
  execSync(`docker-compose down`, execOptions);

  const conditions = {
    benchMark: benchName,
    durationEach: config.duration,
    rounds: config.rounds,
    connections: config.connections,
  };

  const finalResults = [];

  Object.keys(benchResults).forEach(key => {
    const benchResult = benchResults[key];

    const resultsLength = benchResult.results.length;
    const total = benchResult.results.reduce((a, b) => {
      return {
        totalRequests: a.totalRequests + b.totalRequests,
        rps: a.rps + b.rps,
        averageLatency: a.averageLatency + b.averageLatency,
        errors: a.errors + b.errors,
        timeouts: a.timeouts + b.timeouts,
      };
    });

    const result = {
      app: `${framework.language}:${framework.name}`,
      totalRequests: total.totalRequests,
      averageRps: Number((total.rps / resultsLength).toFixed(2)),
      averageRequests: Number((total.totalRequests / resultsLength).toFixed(2)),
      averageLatency: Number((total.averageLatency / resultsLength).toFixed(2)),
      totalErrors: total.errors,
      totalTimeouts: total.timeouts,
    };

    finalResults.push(result);
  });

  console.table([conditions]);
  console.table(
    finalResults.sort((first, second) => {
      if (second.averageRps > first.averageRps) return 1;
      if (first.averageRps > second.averageRps) return -1;
      return 0;
    }),
  );

  const filePath = path.join(
    __dirname,
    '../results',
    benchName,
    `results_${Date.now()}.json`,
  );

  newStep(`Saving results to ${filePath} ...`);

  mkdirp(path.dirname(filePath), function(err) {
    if (err) return cb(err);

    fs.writeFileSync(
      filePath,
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
      {},
    );
  });
}

async function init() {
  const frameworks = setup();

  await runAll(frameworks);
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
      print(`Cooling down for ${count} seconds ... ${text.green('done\n\n')}`);
      resolve();
    }, ms);
  });
}

init();
