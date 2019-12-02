## Motivation
Aims to run bench mark tests for different subjects and frameworks on local environment. Similar to what [TechEmpower](https://www.techempower.com/benchmarks/) does but less professional and more custom.

## Requirements
Tests require node, docker and docker-compose(preinstalled on MacOS with docker) to be installed.

## Installation
To install benchmark script depedencies run `npm i`.

## Running benchmark
Run benchmarks with `npm run bench $benchmark_name`. Example:

```npm run bench hello-world```

Each benchmark will build all containers in the beginning and restart related container before each round.