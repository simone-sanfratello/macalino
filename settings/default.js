'use strict'

const package_ = require('../package.json')
const references = require('../src/lib/references')

const settings = {
  running: references.running.PARALLEL,
  log: {
    level: 'warn',
    pretty: false,
    version: package_.version,
    singleton: false
  },
  trace: false
}

module.exports = settings
