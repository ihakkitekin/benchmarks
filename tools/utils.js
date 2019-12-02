
const readline = require('readline');
const { text, print } = require('./text');

function cooldown(ms) {
  let count = (ms / 1000).toFixed(0);
  return new Promise(resolve => {
    const interval = setInterval(() => {
      count--;
      readline.cursorTo(process.stdout, 0);
      print(`Cooling down for ${count} seconds ...`);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      readline.cursorTo(process.stdout, 0);
      print(`Cooling down for ${count} seconds ... ${text.green('done\n\n')}`);
      resolve();
    }, ms);
  });
}

module.exports.cooldown = cooldown;