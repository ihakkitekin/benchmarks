const autocannon = require('autocannon');
const { execSync } = require('child_process');
const argv = require('yargs').argv;

const colors = {
  Black: '\x1b[30m',
  Red: '\x1b[31m',
  Green: '\x1b[32m',
  Yellow: '\x1b[33m',
  Blue: '\x1b[34m',
  Magenta: '\x1b[35m',
  Cyan: '\x1b[36m',
  White: '\x1b[37m',
  Reset: '\x1b[0m',
};

const targetUrl = argv.url;
const app = argv.app;
const targets = [app];
const numberOfRounds = argv.round || 5;

if (argv.nginx) {
  targets.push('nginx');
}

if (Number.isNaN(numberOfRounds)) {
  console.log("'run' value is not valid:", numberOfRounds);
  process.exit(1);
}

const paths = ['/'];

if (!Array.isArray(paths) || paths.length === 0) {
  console.log('paths cannot be empty');
  process.exit(1);
}

const benchResults = [];

async function bench(round) {
  const results = await autocannon({
    url: targetUrl,
    connections: 100,
    duration: 10,
    requests: paths.map(path => {
      return { path, method: 'GET' };
    }),
  });

  const res = {
    totalRequests: results.requests.sent,
    rps: results.requests.average,
    averageLatency: results.latency.average,
    errors: results.errors,
    timeouts: results.timeouts,
  };

  console.log(
    `\nRound ${round} results:\n`,
    JSON.stringify(res, null, 4),
    '\n',
  );
  benchResults.push(res);
}

async function warmUp() {
  await autocannon({
    url: targetUrl,
    connections: 10,
    duration: 10,
    requests: paths.map(path => {
      return { path };
    }),
  });
}

async function runTest(round) {
  process.stdout.write('Warming up ... ');
  await warmUp();

  process.stdout.write(textWithColor('done\n', colors.Green));
  console.log('Starting benchmark ...');
  await bench(round);
}

function textWithColor(text, color) {
  return `${color}${text}${colors.Reset}`;
}

async function init() {
  const containers = targets.join(' ');
  execSync(`docker-compose stop ${containers}`);

  for (let i = 0; i < numberOfRounds; i++) {
    const round = i + 1;

    console.log(
      textWithColor('Starting benchmark test for:', colors.Yellow),
      textWithColor(app, colors.Magenta),
      textWithColor('Round:', colors.Yellow),
      textWithColor(round, colors.Green),
    );

    execSync(`docker-compose start ${containers}`);

    await runTest(round);

    execSync(`docker-compose stop ${containers}`);
  }
}

init();
