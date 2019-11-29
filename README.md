## Motivation
Aims to run bench mark tests for different subjects and frameworks on local environment. Similar to what [TechEmpower](https://www.techempower.com/benchmarks/) does but less professional and more custom.

## Requirements
Tests requires node, docker and docker-compose(preinstalled on MacOS with docker) to be installed.

## Installation
To install benchmark script depedencies run `npm i`. You also need to update variables in *docker-compose.yaml* with your own values, or create and *.env* file in the same directory. You can use *.env.example* as an example configuration.

## Running benchmark
Run benchmarks with `npm run bench $benchmark_name`. Example:

```npm run bench http-proxy```

Each benchmark will build all containers in the beginning and restart related container before each round.