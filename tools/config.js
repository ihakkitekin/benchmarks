const { lstatSync, readdirSync, writeFileSync, readFileSync } = require('fs');
const path = require('path');
const _ = require('lodash');

function getDirectoryNames(source) {
  return readdirSync(source).filter(name =>
    lstatSync(path.join(source, name)).isDirectory(),
  );
}

function getServiceTemplate(framework, env) {
  return `
  ${framework.language}-${framework.name}:
    build:
      context: ${framework.language}/${framework.name}
      dockerfile: Dockerfile
    ports:
      - ${framework.port}:${framework.port}
    environment: \n${' '.repeat(6)}${Object.keys(env)
    .map(key => `${key}: ${env[key]}`)
    .join(`\n${' '.repeat(6)}`)}`;
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
  let env = {};

  try {
    env = JSON.parse(readFileSync(path.join(source, 'env.json')));
  } catch (error) {}

  const services = _.map(frameworks, framework => {
    return getServiceTemplate(framework, env);
  });

  const yaml = `version: '3.1'\nservices:${services.join('\n')}`;
  writeFileSync(`${source}/docker-compose.yaml`, yaml);
}

module.exports.getFrameworks = getFrameworks;
module.exports.generateComposeFile = generateComposeFile;
