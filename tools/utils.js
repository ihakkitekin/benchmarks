
const readline = require('readline');
const { text, print } = require('./text');

function wait(ms) {
  let count = (ms / 1000).toFixed(0);
  return new Promise(resolve => {
    const interval = setInterval(() => {
      count--;
      readline.cursorTo(process.stdout, 0);
      print(`Waiting for ${count} seconds ...`);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      readline.cursorTo(process.stdout, 0);
      print(`Waiting for ${count} seconds ... ${text.green('done\n')}`);
      resolve();
    }, ms);
  });
}

module.exports.wait = wait;