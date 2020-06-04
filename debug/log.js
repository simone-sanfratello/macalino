'use strict'

const macalino = require('../src/index')
const helper = require('../test/helper')

const debug = async () => {
  const _series = new macalino.Runner({ log: { level: 'debug', pretty: false } })

  _series.add('debug-task#1', async () => { await helper.deelay(200); return 1 })
  _series.add('debug-task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'debug-task#1' })
  _series.add('debug-task#2', async () => { await helper.deelay(50); return 2 })
  _series.add('debug-task#3', async () => { await helper.deelay(150); return 3 }, { wait: ['debug-task#1', 'debug-task#2'] })

  await _series.run()
}

debug()
