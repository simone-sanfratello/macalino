'use strict'

const references = {
  TIMEOUT_LIMIT: 5000, // ms
  task: {
    running: {
      SINGLE: 'SINGLE',
      SERIES: 'SERIES',
      PARALLEL: 'PARALLEL'
    }
  },
  running: {
    SERIES: 'SERIES',
    PARALLEL: 'PARALLEL'
  },
  state: {
    INIT: 'INIT',
    RUNNING: 'RUNNING',
    STOP: 'STOP',
    PAUSE: 'PAUSE',
    DONE: 'DONE'
  },
  select: {
    NONE: 'NONE',
    ONLY: 'ONLY',
    SKIP: 'SKIP'
  }
}

module.exports = references
