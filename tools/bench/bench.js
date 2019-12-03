const autocannon = require('autocannon');
const { execSync } = require('child_process');
const path = require('path');
const { text, print, newStep, newBenchMark } = require('../text');
const { cooldown } = require('../utils');
const { getDirectoryNames } = require('../file');
const {
  saveResultsToFile,
  mapRoundResult,
  createEmptyResults,
  mapBenchResults,
} = require('../results');
const { getFrameworks, generateComposeFile } = require('../config');
const mainConfig = require('./bench.config.json');


function setup(benchName) {
  const source = path.join(__dirname, `../../apps/${benchName}`);

  const benchConfig = require(path.join(source, 'bench.config.json'));

  const frameworks = getFrameworks(source);
  generateComposeFile(frameworks, source);
  benchResults = createEmptyResults(frameworks, benchConfig);

  return { frameworks, benchConfig, benchResults, source };
}

async function bench(framework, round, path) {
  print('Running ... ');
  const results = await autocannon({
    url: `http://localhost:${framework.port}${path}`,
    connections: mainConfig.connections,
    duration: mainConfig.duration,
  });
  console.log(text.green('done'));

  const res = mapRoundResult(results, round);

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

async function run(benchName) {
  newBenchMark(benchName);

  const { frameworks, benchConfig, benchResults, source } = setup(benchName);

  const execOptions = {
    cwd: source,
  };

  newStep('Stopping containers if already running ...');
  execSync(`docker-compose down`, execOptions);

  newStep('Building containers ...');
  execSync('docker-compose build && docker-compose up --no-start', execOptions);

  for (let j = 0; j < frameworks.length; j++) {
    const framework = frameworks[j];
    const benchFramework = `${framework.language}-${framework.name}`;

    try {
      for (let i = 0; i < benchConfig.paths.length; i++) {
        const path = benchConfig.paths[i];

        newStep(
          'Starting benchmark test for:',
          text.magenta(benchFramework),
          'on:',
          text.magenta(path),
        );

        for (let i = 0; i < mainConfig.rounds; i++) {
          const round = i + 1;

          console.log(text.yellow('Round:'), text.green(round));
          execSync(`docker-compose start ${benchFramework}`, execOptions);

          if (mainConfig.warmUp) {
            await warmUp(framework, path);
          }

          const res = await bench(framework, round, path);

          const currentBenchPath = benchResults.find(res => res.path === path);
          const benchResult = currentBenchPath.frameworks.find(
            res => res.name === benchFramework,
          );

          benchResult.results.push(res);

          execSync(`docker-compose stop ${benchFramework}`, execOptions);

          if (mainConfig.cooldown) {
            await cooldown(10000);
          }
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  newStep('Stopping all containers ...');
  execSync(`docker-compose down`, execOptions);

  const conditions = {
    benchMark: benchName,
    durationEach: mainConfig.duration,
    rounds: mainConfig.rounds,
    connections: mainConfig.connections,
  };

  const finalResults = benchResults.map(result => {
    const pathResult = {
      path: result.path,
      frameworks: mapBenchResults(result.frameworks),
    };

    console.table([{ ...conditions, path: pathResult.path }]);
    console.table(pathResult.frameworks);

    return pathResult;
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
  const benchName = process.argv[2];

  if (benchName) {
    await run(benchName);
  } else {
    const source = path.join(__dirname, '../../apps');
    const benchNames = getDirectoryNames(source);

    for (let i = 0; i < benchNames.length; i++) {
      const benchName = benchNames[i];

      await run(benchName);
    }
  }
}

init();
