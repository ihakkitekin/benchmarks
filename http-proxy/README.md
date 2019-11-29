# Http proxy benchmarks
Apps function as simple proxy server. Running them requires docker and docker-compose(on MacOS preinstalled) to be installed.

## Installation
To install benchmark script depedencies run `npm i`. Then run `docker-compose build` and `docker-compose up --no-start` to build containers. If you are going to use nginx in benchmarks you need to build nginx after changing *nginx.conf* to desired app. Then run `docker-compose build nginx` and `docker-compose up --no-start nginx` respectively. You also need to update variables in *docker-compose.yaml* with your own values, or create and *.env* file in the same directory. You can use *.env.example* as an example configuration.

## Running benchmark
Run benchmarks with `npm run bench` command with required arguments. Example:

```npm run bench --url=http://localhost:3001 --round=10 --nginx --app=rust```

**url**: Target url to run benchmarks. *Required*

**round**: Number of rounds to run benchmarks. Each round containers will be restarted and warmed up. *Defaults to 5*

**nginx**: If given nginx container will also be used in benchmark.

**app**: Application to run. Needs to match service given in *docker-compose.yaml*. *Required*

Additionally, if you want to run benchmark against different paths, you can updated the *paths* array in *bench.js*. Paths defaults to '/'.