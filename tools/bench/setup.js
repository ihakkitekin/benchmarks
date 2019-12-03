const path = require('path');
const { createEmptyResults } = require('../results');
const { getFrameworks, generateComposeFile } = require('../config');

function setup(benchName) {
  const source = path.join(__dirname, `../../apps/${benchName}`);

  const benchConfig = require(path.join(source, 'bench.config.json'));

  const frameworks = getFrameworks(source);
  generateComposeFile(frameworks, source);
  benchResults = createEmptyResults(frameworks, benchConfig);

  return { frameworks, benchConfig, benchResults, source };
}

module.exports.setup = setup;
