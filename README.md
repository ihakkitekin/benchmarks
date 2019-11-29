# Http proxy benchmarks
Apps function as simple proxy server. Running them requires docker and docker-compose(on MacOS preinstalled) to be installed.

## Installation
To install benchmark script depedencies run `npm i`. You also need to update variables in *docker-compose.yaml* with your own values, or create and *.env* file in the same directory. You can use *.env.example* as an example configuration.

## Running benchmark
Run benchmarks with `npm run bench $benchmark_name`. Example:

```npm run bench http-proxy```

Each benchmark will build all containers in the beginning and restart related container before each round.