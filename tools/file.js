const { lstatSync, readdirSync } = require('fs');
const path = require('path');

function getDirectoryNames(source) {
  return readdirSync(source).filter(name =>
    lstatSync(path.join(source, name)).isDirectory(),
  );
}

module.exports.getDirectoryNames = getDirectoryNames;
