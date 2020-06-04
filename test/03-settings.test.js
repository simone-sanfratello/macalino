'use strict'

const macalino = require('../src/index')
const helper = require('./helper')

describe('settings option "running"', () => {
  test('run parallel vs run series', async () => {
    const _parallel = new macalino.Runner()
    const _series = new macalino.Runner({ running: macalino.running.SERIES })
    const _runParallel = []
    const _runSeries = []

    _parallel.add('task#1', async () => { await helper.deelay(200); _runParallel.push('task#1') })
    _parallel.add('task#1.1', async () => { await helper.deelay(100); _runParallel.push('task#1.1') }, { wait: 'task#1' })
    _parallel.add('task#2', async () => { await helper.deelay(50); _runParallel.push('task#2') })
    _parallel.add('task#3', async () => { await helper.deelay(150); _runParallel.push('task#3') }, { wait: ['task#1', 'task#2'] })

    _series.add('task#1', async () => { await helper.deelay(200); _runSeries.push('task#1') })
    _series.add('task#1.1', async () => { await helper.deelay(100); _runSeries.push('task#1.1') }, { wait: 'task#1' })
    _series.add('task#2', async () => { await helper.deelay(50); _runSeries.push('task#2') })
    _series.add('task#3', async () => { await helper.deelay(150); _runSeries.push('task#3') }, { wait: ['task#1', 'task#2'] })

    await _parallel.run()
    await _series.run()

    expect(_runParallel).toEqual(['task#2', 'task#1', 'task#1.1', 'task#3'])
    expect(_runSeries).toEqual(['task#1', 'task#2', 'task#1.1', 'task#3'])
  })
})

describe('settings option "log"', () => {
  test('log level trace', async () => {
    const _runner = new macalino.Runner({ log: { level: 'trace' } })

    _runner.add('trace-task#1', async () => { await helper.deelay(200); return 1 })
    _runner.add('trace-task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'trace-task#1' })
    _runner.add('trace-task#2', async () => { await helper.deelay(50); return 2 })
    _runner.add('trace-task#3', async () => { await helper.deelay(150); return 3 }, { wait: ['trace-task#1', 'trace-task#2'] })

    await _runner.run()
  })

  test('log level debug', async () => {
    const _runner = new macalino.Runner({ log: { level: 'debug' } })

    _runner.add('debug-task#1', async () => { await helper.deelay(200); return 1 })
    _runner.add('debug-task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'debug-task#1' })
    _runner.add('debug-task#2', async () => { await helper.deelay(50); return 2 })
    _runner.add('debug-task#3', async () => { await helper.deelay(150); return 3 }, { wait: ['debug-task#1', 'debug-task#2'] })

    await _runner.run()
  })

  test('log level off', async () => {
    const _runner = new macalino.Runner({ log: { level: 'silent' } })

    _runner.add('off-task#1', async () => { await helper.deelay(200); return 1 })
    _runner.add('off-task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'off-task#1' })
    _runner.add('off-task#2', async () => { await helper.deelay(50); return 2 })
    _runner.add('off-task#3', async () => { await helper.deelay(150); return 3 }, { wait: ['off-task#1', 'off-task#2'] })

    await _runner.run()
  })

  // @todo multiple runners different log settings
})

describe('settings option "trace"', () => {
  test('trace time', async () => {
    const _runner = new macalino.Runner({ trace: true })

    _runner.add('task#1', async () => { await helper.deelay(200); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })
    _runner.add('task#3', async () => { await helper.deelay(150); return 3 }, { wait: ['task#1', 'task#2'] })

    await _runner.run()
    const _trace = _runner.trace()
    expect(_trace['task#1'].start).toBeLessThan(Date.now())
    expect(_trace['task#1'].end).toBeGreaterThan(_trace['task#1'].start)
    expect(_trace['task#1'].duration).toBeGreaterThanOrEqual(200)
  })

  test('get trace but trace was not enabled', async () => {
    const _runner = new macalino.Runner()

    _runner.add('task#1', () => { return 1 })

    await _runner.run()
    const _trace = _runner.trace()
    expect(_trace).toEqual({ error: 'trace was not enabled before start' })
  })
})
