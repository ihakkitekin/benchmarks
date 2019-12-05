const { execSync } = require('child_process');
const { text, print } = require('../text');
const { wait } = require('../utils');

function Container(framework, benchName, environment, resources, execOptions) {
  this.framework = framework;
  this.benchFramework = `${framework.language}-${framework.name}`;
  this.tag = `${benchName}_${this.benchFramework}`;
  this.execOptions = execOptions;
  this.environment = Object.keys(environment)
    .map(key => {
      const value = environment[key];

      return `-e ${key}='${value}'`;
    })
    .join(' ');
  this.resources = resources;

  this.removeIfExist = function() {
    print('Remove container if it already exist ...\n');
    execSync(
      `docker container stop ${this.tag} || true && docker container rm ${this.tag} || true`,
      this.execOptions,
    );
  };

  this.remove = async function(cooldown, isLastRound) {
    print('Stopping container ... ');
    execSync(`docker container stop ${this.tag} || true`, this.execOptions);
    print(text.green('done\n'));

    print('Removing container ... ');
    execSync(`docker container rm ${this.tag} || true`, this.execOptions);
    print(text.green('done\n\n'));

    if (cooldown && !isLastRound) {
      await wait(10000);
    }
  };

  this.build = function() {
    print(`Building ${this.benchFramework} container ... `);
    execSync(`docker build -t ${this.tag} .`, this.execOptions);
    print(text.green('done\n\n'));
  };

  this.create = function(round) {
    console.log(text.yellow('\nRound:'), text.green(round));

    const resources = this.resources
      ? `-m=${this.resources.memory} --cpus=${this.resources.cpus}`
      : '';

    print('Creating container ... ');
    execSync(
      `docker create -p ${this.framework.port}:${this.framework.port} --name=${this.tag} ${this.environment} ${resources} ${this.tag}:latest`,
      this.execOptions,
    );
    print(text.green('done\n'));

    print('Starting container ... ');
    execSync(`docker start ${this.tag}`, this.execOptions);
    print(text.green('done\n'));
  };
}

module.exports.Container = Container;
