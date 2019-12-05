const path = require('path');
const _ = require('lodash');
const { getDirectoryNames } = require('./file');

function getFrameworks(source) {
  const map = getDirectoryNames(source).map(language => {
    return getDirectoryNames(path.join(source, language)).map(framework => {
      return require(path.join(
        source,
        language,
        framework,
        'bench.config.json',
      ));
    });
  });

  return _.flatten(map);
}

module.exports.getFrameworks = getFrameworks;
