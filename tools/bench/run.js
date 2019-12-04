const { execSync } = require('child_process');
const path = require('path');
const { text, newStep, newBenchMark } = require('../text');
const { warmUp, bench } = require('./bench');
const { setup } = require('./setup');
const { cooldown } = require('../utils');
const { getDirectoryNames } = require('../file');
const {
  saveResultsToFile,
  mapFrameworkResults,
  mapRoundByRoundResults,
} = require('../result/result');
const mainConfig = require('./bench.config.json');

async function run(benchName) {
  newBenchMark(benchName);

  const { frameworks, benchConfig, benchResults, source } = setup(
    benchName,
    mainConfig,
  );

  const execOptions = {
    cwd: source,
  };

  newStep('Stopping containers if already running ...');
  execSync(`docker-compose down`, execOptions);

  newStep('Building containers ...');
  execSync(
    `docker-compose build ${
      mainConfig.noCache ? '--no-cache' : ''
    }&& docker-compose up --no-start`,
    execOptions,
  );

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
          const benchResult = currentBenchPath.rounds
            .find(r => r.round === round)
            .results.find(res => res.name === benchFramework);

          benchResult.result = res;

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
    benchmarkName: benchName,
    durationEach: mainConfig.duration,
    rounds: mainConfig.rounds,
    connections: mainConfig.connections,
  };

  const finalResults = benchResults.map(result => {
    const pathResult = {
      path: result.path,
      frameworks: mapFrameworkResults(result.rounds),
    };

    console.table([{ ...conditions, path: pathResult.path }]);
    console.table(pathResult.frameworks);

    return pathResult;
  });

  saveResultsToFile(benchName, {
    ...conditions,
    finalResults,
    roundByRound: mapRoundByRoundResults(benchResults),
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
