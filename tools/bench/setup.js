const path = require('path');
const { createEmptyResults } = require('../result/result');
const { getFrameworks } = require('../config');

function setup(benchName, mainConfig) {
  const source = path.join(__dirname, `../../apps/${benchName}`);

  const benchConfig = require(path.join(source, 'bench.config.json'));

  const frameworks = getFrameworks(source);
  benchResults = createEmptyResults(frameworks, benchConfig, mainConfig);

  return { frameworks, benchConfig, benchResults, source };
}

module.exports.setup = setup;
