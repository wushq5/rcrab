'use strict';

const argv = require('yargs')
    .usage('Usage: $0 <command> [options]')
    .command('server', 'local API server (-p port || 3002)')
    .argv;

module.exports = argv;