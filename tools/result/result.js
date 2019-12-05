const path = require('path');
const mkdirp = require('mkdirp');
const fs = require('fs');
const { newStep, text } = require('../text');
const mustache = require('mustache');
const { template } = require('./template');
const _ = require('lodash');
const opener = require('opener');

const initalFrameworkResult = {
  totalRequests: 0,
  rps: 0,
  averageLatency: 0,
  errors: 0,
  timeouts: 0,
};

function saveResultsToFile(benchName, results) {
  let date = new Date();
  const timestamp = date.getTime();
  const filePath = path.join(
    __dirname,
    '../../results',
    benchName,
    `results_${timestamp}.json`,
  );

  const htmlFilePath = path.join(
    __dirname,
    '../../results',
    benchName,
    'html',
    `results_${timestamp}.html`,
  );

  newStep(`Saving results to ${filePath} and ${htmlFilePath} ...`);

  const html = generateHtml({
    ...results,
    __pageTitle: benchName,
    __date: date.toDateString() + ' - ' + date.toLocaleTimeString(),
  });

  mkdirp(path.dirname(htmlFilePath), function(err) {
    if (err) return cb(err);

    fs.writeFileSync(filePath, JSON.stringify(results, null, 2));
    fs.writeFileSync(htmlFilePath, html);
    opener(htmlFilePath);
  });
}

function mapRoundResult(results) {
  return {
    totalRequests: results.requests.sent,
    rps: results.requests.average,
    averageLatency: results.latency.average,
    errors: results.errors,
    timeouts: results.timeouts,
  };
}

function mapRoundByRoundResults(results) {
  results.forEach(pathResult => {
    pathResult.rounds.forEach(roundResults => {
      const sorted = _.orderBy(roundResults.results, 'result.rps', 'desc');
      roundResults.results = sorted;
    });
  });

  return {
    paths: results,
  };
}

function createEmptyResults(frameworks, benchConfig, mainConfig) {
  return benchConfig.paths.map(path => {
    let rounds = [];

    for (let i = 0; i < mainConfig.rounds; i++) {
      const frameworkResults = frameworks.map(framework => {
        return {
          name: `${framework.language}-${framework.name}`,
          result: null,
        };
      });

      rounds.push({
        round: i + 1,
        results: frameworkResults,
      });
    }

    return {
      path,
      rounds,
    };
  });
}

function mapFrameworkResults(rounds) {
  const totalResults = _.flatMap(rounds, round => round.results);

  const groupedResults = _.groupBy(totalResults, 'name');

  const result = Object.values(groupedResults).map(frameworkResults => {
    const resultsLength = frameworkResults.length;
    const total = frameworkResults.reduce((acc, iter) => {
      const result = iter.result;

      return {
        totalRequests: acc.totalRequests + result.totalRequests,
        rps: acc.rps + result.rps,
        averageLatency: acc.averageLatency + result.averageLatency,
        errors: acc.errors + result.errors,
        timeouts: acc.timeouts + result.timeouts,
      };
    }, initalFrameworkResult);

    return {
      app: frameworkResults[0].name,
      totalRequests: total.totalRequests,
      averageRps: Number((total.rps / resultsLength).toFixed(2)),
      averageRequests: Number((total.totalRequests / resultsLength).toFixed(2)),
      averageLatency: Number((total.averageLatency / resultsLength).toFixed(2)),
      totalErrors: total.errors,
      totalTimeouts: total.timeouts,
    };
  });

  return _.orderBy(result, 'averageRps', 'desc');
}

function generateHtml(results) {
  return mustache.render(template, results);
}

module.exports.saveResultsToFile = saveResultsToFile;
module.exports.mapRoundResult = mapRoundResult;
module.exports.mapFrameworkResults = mapFrameworkResults;
module.exports.createEmptyResults = createEmptyResults;
module.exports.mapRoundByRoundResults = mapRoundByRoundResults;
