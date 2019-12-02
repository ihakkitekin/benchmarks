const { lstatSync, readdirSync, writeFileSync, readFileSync } = require('fs');
const path = require('path');
const _ = require('lodash');

function getDirectoryNames(source) {
  return readdirSync(source).filter(name =>
    lstatSync(path.join(source, name)).isDirectory(),
  );
}

function getServiceTemplate(framework) {
  return `
  ${framework.language}-${framework.name}:
    build:
      context: ${framework.language}/${framework.name}
      dockerfile: Dockerfile
    ports:
      - ${framework.port}:${framework.port}`;
}

function getFrameworks(source) {
  const map = getDirectoryNames(source).map(language => {
    return getDirectoryNames(path.join(source, language)).map(framework => {
      return JSON.parse(
        readFileSync(
          path.join(source, language, framework, 'bench.config.json'),
        ),
      );
    });
  });

  return _.flatten(map);
}

function generateComposeFile(frameworks, source) {
  const services = _.map(frameworks, framework => {
      return getServiceTemplate(framework);
    });

  const yaml = `version: '3.1'\nservices:${services.join('\n')}`;

  writeFileSync(`${source}/docker-compose.yaml`, yaml);
}

module.exports.getFrameworks = getFrameworks;
module.exports.generateComposeFile = generateComposeFile;
