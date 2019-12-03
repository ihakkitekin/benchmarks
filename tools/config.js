const { writeFileSync } = require('fs');
const path = require('path');
const _ = require('lodash');
const { getDirectoryNames } = require('./file');

function getServiceTemplate(framework, env) {
  return `
  ${framework.language}-${framework.name}:
    build:
      context: ${framework.language}/${framework.name}
      dockerfile: Dockerfile
    ports:
      - ${framework.port}:${framework.port}
    ${
      !_.isEqual(env, {})
        ? `environment: \n${' '.repeat(6)}${Object.keys(env)
            .map(key => `${key}: ${env[key]}`)
            .join(`\n${' '.repeat(6)}`)}`
        : ''
    }
    `;
}

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

function generateComposeFile(frameworks, source) {
  let env;

  try {
    const config = require(path.join(source, 'bench.config.json'));
    env = config.environment || {};
  } catch (error) {}

  const services = _.map(frameworks, framework => {
    return getServiceTemplate(framework, env);
  });

  const yaml = `version: '3.1'\nservices:${services.join('\n')}`;
  writeFileSync(`${source}/docker-compose.yaml`, yaml);
}

module.exports.getFrameworks = getFrameworks;
module.exports.generateComposeFile = generateComposeFile;
