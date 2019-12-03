const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const { newStep } = require('./text');

function saveResultsToFile(benchName, results) {
  const filePath = path.join(
    __dirname,
    '../results',
    benchName,
    `results_${Date.now()}.json`,
  );

  newStep(`Saving results to ${filePath} ...`);
  mkdirp(path.dirname(filePath), function(err) {
    if (err) return cb(err);

    fs.writeFileSync(filePath, JSON.stringify(results, null, 2), {});
  });
}

function mapRoundResult(results, round) {
  return {
    round,
    totalRequests: results.requests.sent,
    rps: results.requests.average,
    averageLatency: results.latency.average,
    errors: results.errors,
    timeouts: results.timeouts,
  };
}

function createEmptyResults(frameworks, benchConfig) {
  return benchConfig.paths.map(path => {
    return {
      path,
      frameworks: frameworks.map(framework => {
        return {
          name: `${framework.language}-${framework.name}`,
          results: [],
        };
      }),
    };
  });
}

function mapBenchResults(benchResults) {
  return benchResults
    .map(benchResult => {
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

      return {
        app: benchResult.name,
        totalRequests: total.totalRequests,
        averageRps: Number((total.rps / resultsLength).toFixed(2)),
        averageRequests: Number(
          (total.totalRequests / resultsLength).toFixed(2),
        ),
        averageLatency: Number(
          (total.averageLatency / resultsLength).toFixed(2),
        ),
        totalErrors: total.errors,
        totalTimeouts: total.timeouts,
      };
    })
    .sort((first, second) => {
      if (second.averageRps > first.averageRps) return 1;
      if (first.averageRps > second.averageRps) return -1;
      return 0;
    });
}

module.exports.saveResultsToFile = saveResultsToFile;
module.exports.mapRoundResult = mapRoundResult;
module.exports.mapBenchResults = mapBenchResults;
module.exports.createEmptyResults = createEmptyResults;
