const { exec } = require('child_process');

const splitRegex = /\s{2,}|\t/g;

const execPromise = (command, options) =>
  new Promise((resolve, reject) => {
    exec(command, options, (err, stdout, stderr) => {
      if (err) {
        return reject(err);
      }

      return resolve({ out: stdout, err: stderr });
    });
  });

function Metrics(container, execOptions) {
  this.data = [];

  this.interval;

  this.start = function() {
    this.interval = setInterval(this.getMetrics, 200);
  };

  this.end = function() {
    clearInterval(this.interval);
    return this.data;
  };

  this.getMetrics = async function() {
    try {
      const std = await execPromise(
        `docker stats --no-stream ${container.tag}`,
        execOptions,
      );

      const timestamp = new Date().getTime();
      const data = {};

      const [keysString, valuesString] = std.out.split('\n');
      const keys = keysString.split(splitRegex);
      const values = valuesString.split(splitRegex);

      keys.forEach((key, index) => {
        data[key] = values[index];
      });

      const result = {
        timestamp,
        data,
      };

      this.data.push(result);
    } catch (error) {}
  };


  this.getMetrics = this.getMetrics.bind(this);
}

module.exports.Metrics = Metrics;
