export class Composter {
  constructor(docker, logger) {
    this._docker = docker;
    this._logger = logger;
  }

  removeDuplicates(a) {
    return Object.keys(a.reduce((acc, curr) => {
      acc[curr] = '';
      return acc;
    }, {}));
  }

  async up(config) {
    this._logger.group('creating networks, volumes, and images');
    await Promise.all([
      // ensure networks exist
      this.removeDuplicates(Object.keys(config.networks)).map(elem => this._docker.ensureNetworkExists(elem, config.networks[elem].config)),
      // ensure volumes exist
      this.removeDuplicates(Object.keys(config.volumes)).map(elem => this._docker.ensureVolumeExists(elem, config.volumes[elem].config)),
      // ensure images exist
      this.removeDuplicates(Object.values(config.containers).map(elem => elem.config.Image)).map(elem => this._docker.ensureImageExists(elem))
    ].reduce((acc, val) => acc.concat(val), []));
    this._logger.groupEnd();
    // ensure containers exist
    this._logger.group('creating containers');
    await Promise.all(
      Object.keys(config.containers).map(elem => this._docker.ensureContainerExists(elem, config.containers[elem].config))
    );
    this._logger.groupEnd();
    // ensure containers are started in order
    this._logger.group('starting containers');
    for (const containerName of Object.keys(config.containers)) {
      await this._docker.ensureContainerIsRunning(containerName);
    }
    this._logger.groupEnd();
  }

  async down(config) {
    // ensure containers are stopped in reverse order
    this._logger.group('stopping containers');
    for (const containerName of Object.keys(config.containers).reverse()) {
      await this._docker.ensureContainerIsStopped(containerName);
    }
    this._logger.groupEnd();
    // ensure containers are removed
    this._logger.group('removing containers');
    await Promise.all(
      Object.keys(config.containers).map(elem => this._docker.ensureContainerIsRemoved(elem))
    );
    this._logger.groupEnd();
    // ensure all non-external networks, transient volumes, and dangling images are removed
    this._logger.group('removing networks, volumes, and images');
    await Promise.all([
      this.removeDuplicates(Object.keys(config.networks)).filter(elem => config.networks[elem].type != 'external').map(elem => this._docker.ensureNetworkIsRemoved(elem)),
      this.removeDuplicates(Object.keys(config.volumes)).filter(elem => config.volumes[elem].type === 'transient').map(elem => this._docker.ensureVolumeIsRemoved(elem)),
      this.removeDuplicates(Object.values(config.containers).map(elem => elem.config.Image)).map(elem => this._docker.removeUnusedImage(elem))
    ].reduce((acc, val) => acc.concat(val), []))
    this._logger.groupEnd();
  }
}
