![CI](https://github.com/hannes-hochreiner/docker-composter/workflows/CI/badge.svg)
![CD](https://github.com/hannes-hochreiner/docker-composter/workflows/CD/badge.svg)
# docker-composter
Deployment tool for Docker container.
It will create a fertile ground for your application to grow.

# Usage
## CLI
Docker-Composter can be used as a command line program.
It expects either "up" or "down" as a command and the configuration file as an option.
```shell
./node_modules/.bin/docker-composter up -c configuration.json
```

## Package
Docker-Composter can be used as a package as shown in the example below.
```js
const dockerComposter = require('docker-composter');
const axios = require('axios');

const request = axios.create({
  socketPath: '/var/run/docker.sock'
})
const config = {
  "networks": {
    "test1_net": {"type": "external"},
    "test2_net": {},
  },
  "volumes": {
    "test1_vol": {},
    "test2_vol": {"type": "transient"},
  },
  "containers": {
    "test1_cont": {
      "config": {
        "Image": "nginx:alpine",
        "NetworkingConfig": {"EndpointsConfig": {"test1_net": {}}}
      }
    },
    "test2_cont": {
      "config": {
        "Image": "nginx:alpine",
        "NetworkingConfig": {"EndpointsConfig": {"test2_net": {}}}
      }
    }
  }
};

const docker = new dockerComposter.Docker(request, console);
const composter = new dockerComposter.Composter(docker, console);

async function run() {
  await composter.up(config);
  await composter.down(config);
}

run();
```

# Configuration
Docker-Composter uses JSON files as configuration files.
The configuration files contains three objects: "networks", "volumes", and "containers".
The keys of the objects are the names of the networks, volumes, and containers.
As values configuration objects are expected.
Each configuration object has entries for the options defined below.

## Network Options
  * type (optional, "external"): type of the network; "external" networks will not be removed when the command "down" is issued.
  * config (optional, object): an object as described in the [Docker API](https://docs.docker.com/engine/api/v1.40/#operation/NetworkCreate); "Name" will be replaced by the name of the network as given in the networks object.

## Volume Options
  * type (options, "transient"): type of the volume; "transient" volumes will be removed when the command "down" is issued.
  * config (optional, object): an object as described in the [Docker API](https://docs.docker.com/engine/api/v1.40/#operation/VolumeCreate); "Name" will be replaced by the name of the volume as given in the volumes object.

## Container Options
  * config (optional, object): an object as described in the [Docker API](https://docs.docker.com/engine/api/v1.40/#operation/ContainerCreate)

## Example
```JSON
{
  "networks": {
    "test1_net": {"type": "external"},
    "test2_net": {},
    "test3_net": {}
  },
  "volumes": {
    "test1_vol": {},
    "test2_vol": {"type": "transient"},
    "test3_vol": {}
  },
  "containers": {
    "test1_cont": {
      "config": {
        "Image": "nginx:alpine",
        "NetworkingConfig": {"EndpointsConfig": {"test1_net": {}}}
      }
    },
    "test2_cont": {
      "config": {
        "Image": "nginx:alpine",
        "NetworkingConfig": {"EndpointsConfig": {"test2_net": {}}}
      }
    },
    "test3_cont": {
      "config": {
        "Image": "nginx:alpine",
        "NetworkingConfig": {"EndpointsConfig": {"test3_net": {}}}
      }
    }
  }
}
```
