const autocannon = require('autocannon');
const { execSync } = require('child_process');
const { text, print, newStep } = require('../text');
const { cooldown } = require('../utils');
const {
  saveResultsToFile,
  mapRoundResult,
  createEmptyResults,
  mapBenchResult,
} = require('../results');
const { getFrameworks, generateComposeFile } = require('../config');
const path = require('path');

const benchName = process.argv[2];
const source = path.join(__dirname, `../../apps/${benchName}`);
const benchConfig = require(path.join(source, 'bench.config.json'));
const mainConfig = require('./bench.config.json');

const execOptions = {
  cwd: source,
};

let benchResults;

const conditions = {
  benchMark: benchName,
  durationEach: mainConfig.duration,
  rounds: mainConfig.rounds,
  connections: mainConfig.connections,
};

function setup() {
  const frameworks = getFrameworks(source);
  generateComposeFile(frameworks, source);
  benchResults = createEmptyResults(frameworks, benchConfig);

  return frameworks;
}

async function bench(framework, round, path) {
  const results = await autocannon({
    url: `http://localhost:${framework.port}${path}`,
    connections: mainConfig.connections,
    duration: mainConfig.duration,
  });

  const res = mapRoundResult(results, round);

  if (mainConfig.roundByRoundResults) {
    print(`\nRound ${round} results:\n`, JSON.stringify(res, null, 2), '\n');
  }

  const resName = `${framework.language}:${framework.name}`;

  const currentBenchPath = benchResults.find(res => res.path === path);
  const benchResult = currentBenchPath.frameworks.find(
    res => res.name === resName,
  );

  benchResult.results.push(res);
}

async function warmUp(framework, path) {
  await autocannon({
    url: `http://localhost:${framework.port}${path}`,
    connections: 10,
    duration: 10,
  });
}

async function run(framework, path) {
  const container = `${framework.language}-${framework.name}`;

  newStep(
    'Starting benchmark test for:',
    text.magenta(`${framework.language}:${framework.name}`),
    'on:',
    text.magenta(path),
  );

  for (let i = 0; i < mainConfig.rounds; i++) {
    const round = i + 1;

    console.log(text.yellow('Round:'), text.green(round));
    execSync(`docker-compose start ${container}`, execOptions);

    if (mainConfig.warmUp) {
      print('Warming up ... ');
      await warmUp(framework, path);
      console.log(text.green('done'));
    }

    print('Running ... ');
    await bench(framework, round, path);
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
      for (let i = 0; i < benchConfig.paths.length; i++) {
        const path = benchConfig.paths[i];
        await run(framework, path);
      }
    } catch (error) {
      console.error(error);
    }
  }

  newStep('Stopping all containers ...');
  execSync(`docker-compose down`, execOptions);

  const finalResults = [];

  benchResults.forEach(result => {
    const pathResult = {
      path: result.path,
      frameworks: result.frameworks.map(benchResult => {
        return mapBenchResult(benchResult);
      }),
    };

    console.table([{ ...conditions, path: pathResult.path }]);
    console.table(
      pathResult.frameworks.sort((first, second) => {
        if (second.averageRps > first.averageRps) return 1;
        if (first.averageRps > second.averageRps) return -1;
        return 0;
      }),
    );

    finalResults.push(pathResult);
  });

  saveResultsToFile(benchName, {
    ...conditions,
    finalResults,
    roundByRound: {
      paths: benchResults,
    },
  });
}

async function init() {
  const frameworks = setup();

  await runAll(frameworks);
}

init();
