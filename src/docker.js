export class Docker {
  constructor(request, logger) {
    this._request = request;
    this._logger = logger;
  }

  async ensureNetworkExists(networkName, networkConfig) {
    // get list of all networks
    const networks = (await this._request({
      method: 'get',
      url: '/networks'
    })).data.map(elem => elem.Name);
    // check whether network is in list
    // if network is in list => done
    if (networks.includes(networkName)) {
      this._logger.info(`network "${networkName}" exists`);
      return;
    }
    // otherwise, create network
    let networkData = networkConfig || {};

    networkData.Name = networkName;

    await this._request({
      method: 'post',
      url: '/networks/create',
      data: networkData
    });
    this._logger.info(`created network "${networkName}"`);
  }

  async ensureVolumeExists(volumeName, volumeConfig) {
    // get list of all volumes
    const volumes = (await this._request({
      method: 'get',
      url: '/volumes'
    })).data.Volumes.map(elem => elem.Name);
    // check whether volume is in list
    // if volume is in list => done
    if (volumes.includes(volumeName)) {
      this._logger.info(`volume "${volumeName}" exists`);
      return;
    }
    // otherwise, create volume
    let volumeData = volumeConfig || {};

    volumeData.Name = volumeName;

    await this._request({
      method: 'post',
      url: '/volumes/create',
      data: volumeData
    });
    this._logger.info(`created volume "${volumeName}"`);
  }

  async ensureImageExists(imageName) {
    // get list of all images
    const images = (await this._request({
      method: 'get',
      url: '/images/json'
    })).data.map(elem => elem.RepoTags).reduce((acc, val) => acc.concat(val), []);
    // check whether image is in list
    if (images.includes(imageName)) {
      this._logger.info(`image "${imageName}" exists`);
      return;
    }
    // if image is not in the list, pull image
    await this._request({
      method: 'post',
      url: '/images/create',
      params: {fromImage: imageName}
    });
    this._logger.info(`pulled image "${imageName}"`);
  }

  async ensureContainerExists(containerName, containerConfig) {
    if (await this._containerExists(containerName)) {
      this._logger.info(`container "${containerName}" exists`);
      return;
    }
    // if container is not in list, create container
    await this._request({
      method: 'post',
      url: '/containers/create',
      params: {name: containerName},
      data: containerConfig
    });
    this._logger.info(`created container "${containerName}"`);
  }

  async ensureContainerIsRunning(containerName) {
    // check whether container is running
    const container = (await this._request({
      method: 'get',
      url: `/containers/${containerName}/json`
    })).data;
    // if container is not running, start container
    if (container.State.Running) {
      this._logger.info(`container "${containerName}" is running`);
      return;
    }
    await this._request({
      method: 'post',
      url: `/containers/${containerName}/start`
    });
    this._logger.info(`started container "${containerName}"`);
  }

  async _containerExists(containerName) {
    // get list of containers
    const containers = (await this._request({
      method: 'get',
      url: '/containers/json',
      params: {all: true}
    })).data.map(elem => elem.Names).reduce((acc, val) => acc.concat(val), []).map(elem => elem.substr(1));
    
    return containers.includes(containerName);
  }

  async ensureContainerIsStopped(containerName) {
    if (!await this._containerExists(containerName)) {
      this._logger.info(`container "${containerName}" does not exist`);
      return;
    }
    // check whether container is running
    const container = (await this._request({
      method: 'get',
      url: `/containers/${containerName}/json`
    })).data;
    // if container is not running, return
    if (!container.State.Running) {
      this._logger.info(`container "${containerName}" is not running`);
      return;
    }
    // otherwise, stop it
    await this._request({
      method: 'post',
      url: `/containers/${containerName}/stop`
    });
    await this._request({
      method: 'post',
      url: `/containers/${containerName}/wait`
    });
    this._logger.info(`stopped container "${containerName}"`);
  }

  async ensureContainerIsRemoved(containerName) {
    // get list of containers
    const containers = (await this._request({
      method: 'get',
      url: '/containers/json',
      params: {all: true}
    })).data.map(elem => elem.Names).reduce((acc, val) => acc.concat(val), []).map(elem => elem.substr(1));
    // check whether container is in the list
    if (!containers.includes(containerName)) {
      this._logger.info(`container "${containerName}" does not exist`);
      return;
    }
    // if container is in the list, remove container
    await this._request({
      method: 'delete',
      url: `/containers/${containerName}`
    });
    this._logger.info(`removed container "${containerName}"`);
  }

  async ensureVolumeIsRemoved(volumeName) {
    // get list of all volumes
    const volumes = (await this._request({
      method: 'get',
      url: '/volumes'
    })).data.Volumes.map(elem => elem.Name);
    // check whether volume is in the list
    // if volume is not in the list => done
    if (!volumes.includes(volumeName)) {
      this._logger.info(`volume "${volumeName}" does not exist`);
      return;
    }
    // otherwise, remove volume
    await this._request({
      method: 'delete',
      url: `/volumes/${volumeName}`
    });
    this._logger.info(`removed volume "${volumeName}"`);
  }

  async ensureNetworkIsRemoved(networkName) {
    // get list of all networks
    const networks = (await this._request({
      method: 'get',
      url: '/networks'
    })).data.map(elem => elem.Name);
    // check whether network is in the list
    // if network is not in the list => done
    if (!networks.includes(networkName)) {
      this._logger.info(`network "${networkName}" does not exist`);
      return;
    }
    // otherwise, remove network
    await this._request({
      method: 'delete',
      url: `/networks/${networkName}`
    });
    this._logger.info(`removed network "${networkName}"`);
  }

  async removeUnusedImage(imageName) {
    const image = (await this._request({
      method: 'get',
      url: '/images/json'
    })).data.find(elem => elem.RepoTags.includes(imageName));

    if (typeof image === 'undefined') {
      this._logger.info(`image "${imageName}" does not exist`);
      return;
    }

    if (image.Containers > 0) {
      this._logger.info(`image "${imageName}" is still in use`);
      return;
    }

    await this._request({
      method: 'delete',
      url: `/images/${imageName}`
    });
    this._logger.info(`removed image "${imageName}"`);
  }
}
