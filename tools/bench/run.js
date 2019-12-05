const path = require('path');
const { text, newStep, newBenchMark, print } = require('../text');
const { warmUp, bench } = require('./bench');
const { Metrics } = require('./metrics');
const { Container } = require('./container');
const { setup } = require('./setup');
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

  for (let j = 0; j < frameworks.length; j++) {
    const framework = frameworks[j];
    const execOptions = {
      cwd: path.join(source, framework.language, framework.name),
    };

    const container = new Container(
      framework,
      benchName,
      benchConfig.environment || {},
      mainConfig.resources,
      execOptions,
    );
    const metrics = new Metrics(container, execOptions);

    newStep(`Preparing ${container.benchFramework} for the test`);
    container.removeIfExist();
    container.build();

    try {
      for (let i = 0; i < benchConfig.paths.length; i++) {
        const path = benchConfig.paths[i];

        print(text.yellow('Starting benchmark for:'), text.magenta(path), '\n');

        for (let i = 0; i < mainConfig.rounds; i++) {
          const round = i + 1;
          container.create(round);

          if (mainConfig.warmUp) {
            await warmUp(framework, path);
          }

          if (mainConfig.collectMetrics) {
            metrics.start();
          }

          const res = await bench(framework, round, path);
          metrics.end();

          const currentBenchPath = benchResults.find(res => res.path === path);
          const benchResult = currentBenchPath.rounds
            .find(r => r.round === round)
            .results.find(res => res.name === container.benchFramework);

          benchResult.result = res;
          benchResult.metrics = {
            cpu: JSON.stringify(
              metrics.data.map(metric => metric.data['CPU %'].replace('%', '')),
            ),
            memory: JSON.stringify(
              metrics.data.map(metric => metric.data['MEM %'].replace('%', '')),
            ),
          };

          await container.remove(
            mainConfig.cooldown,
            round === mainConfig.rounds,
          );
        }
      }
    } catch (error) {
      console.error(error);
    }
  }

  const conditions = {
    benchmarkName: benchName,
    durationEach: mainConfig.duration,
    rounds: mainConfig.rounds,
    connections: mainConfig.connections,
    resources: mainConfig.resources,
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
