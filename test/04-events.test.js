'use strict'

const macalino = require('../src/index')
const helper = require('./helper')

describe('event listening', () => {
  test('listening for events', async () => {
    const _runner = new macalino.Runner({ running: macalino.running.SERIES })
    const _events = []

    _runner.add('task#1', async () => { await helper.deelay(200); _events.push('task#1') })
    _runner.add('task#1.1', async () => { await helper.deelay(100); _events.push('task#1.1') }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); _events.push('task#2') })
    _runner.add('task#3', async () => { await helper.deelay(150); _events.push('task#3') }, { wait: ['task#1', 'task#2'] })

    _runner.on('run:start', () => { _events.push('run:start') })
    _runner.off('run:start', () => { _events.push('run:start') })
    _runner.once('run:end', ({ result }) => { _events.push('run:end') })
    _runner.on('task:start', ({ id }) => { _events.push('task:start|' + id) })
    _runner.on('task:end', ({ id }) => { _events.push('task:end|' + id) })
    _runner.off('task:end', ({ id }) => { _events.push('task:end|' + id) })

    await _runner.run()

    expect(_events).toEqual([
      'run:start',
      'task:start|task#1',
      'task#1',
      'task:end|task#1',
      'task:start|task#2',
      'task#2',
      'task:end|task#2',
      'task:start|task#1.1',
      'task#1.1',
      'task:end|task#1.1',
      'task:start|task#3',
      'task#3',
      'task:end|task#3',
      'run:end'
    ])
  })
})
