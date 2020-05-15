#!/usr/bin/env node

import {default as fs, exists} from 'fs';
import {default as axios} from 'axios';
import {default as commander} from 'commander';
import {Docker} from './docker';
import {Composter} from './composter';

commander.arguments('<cmd>')
  .option('-c, --config <path>', 'configuration')
  .action(run);
commander.parse(process.argv);

async function run(cmd, cmdObj) {
  try {
    const request = axios.create({
      socketPath: '/var/run/docker.sock'
    })
    const config = await new Promise((res, rej) => {
      fs.readFile(cmdObj.config, 'utf8', (err, data) => {
        if (err) {
          rej(error);
          return;
        }
  
        res(JSON.parse(data));
      });
    })
  
    const docker = new Docker(request, console);
    const composter = new Composter(docker, console);
  
    if (cmd == 'up') {
      await composter.up(config);
    } else if (cmd == 'down') {
      await composter.down(config);
    } else {
      console.log('invalid command');
      process.exit(1);
    }
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}
