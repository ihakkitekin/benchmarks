const colors = {
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

const RESET = '\x1b[0m';
const text = {};

Object.keys(colors).forEach(color => {
  text[color] = text => {
    return `${colors[color]}${text}${RESET}`;
  };
});

function print(...args) {
  process.stdout.write(args.join(' '));
}

function newLine(count = 1) {
  return '\n'.repeat(count);
}

module.exports.text = text;
module.exports.print = print;
module.exports.newLine = newLine;
