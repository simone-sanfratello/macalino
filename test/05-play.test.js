'use strict'

const macalino = require('../src/index')
const helper = require('./helper')

describe('Runner.start', () => {
  test('start running series', done => {
    const _runner = new macalino.Runner({ running: macalino.running.SERIES })

    _runner.add('task#1', () => { return 'task#1' })
    _runner.add('task#1.1', () => { return 'task#1.1' }, { wait: 'task#1' })
    _runner.add('task#2', () => { return 'task#2' })
    _runner.add('task#3', () => { return 'task#3' }, { wait: ['task#1', 'task#2'] })

    _runner.once('run:end', ({ result }) => {
      expect(result.outputs).toEqual({
        'task#1': 'task#1',
        'task#1.1': 'task#1.1',
        'task#2': 'task#2',
        'task#3': 'task#3'
      })
      done()
    })

    _runner.start()
  })

  test('start running parallel', done => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })

    _runner.add('task#1', async () => { await helper.deelay(150); return 'task#1' })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 'task#1.1' }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 'task#2' })
    _runner.add('task#3', async () => { await helper.deelay(150); return 'task#3' }, { wait: ['task#1', 'task#2'] })

    _runner.once('run:end', ({ result }) => {
      expect(result.outputs).toEqual({
        'task#1': 'task#1',
        'task#1.1': 'task#1.1',
        'task#2': 'task#2',
        'task#3': 'task#3'
      })
      done()
    })

    _runner.start()
  })
})

describe('Runner.stop', () => {
  test('stop running series', done => {
    const _runner = new macalino.Runner({ running: macalino.running.SERIES })

    _runner.add('task#1', () => { return 'task#1' })
    _runner.add('task#1.1', () => { return 'task#1.1' }, { wait: 'task#1' })
    _runner.add('task#2', () => { return 'task#2' })
    _runner.add('task#3', () => { return 'task#3' }, { wait: ['task#1', 'task#2'] })
    _runner.add('task#4', macalino.series(() => { return 'task#4-a' }, () => { return 'task#4-b' }, () => { return 'task#4-c' }), { wait: ['task#3'] })

    _runner.on('task:end', async ({ id }) => {
      if (id === 'task#1') {
        expect(await _runner.stop()).toBe(true)
      }
    })

    _runner.on('run:end', ({ result }) => {
      expect(result.outputs).toEqual({
        'task#1': 'task#1',
        'task#1.1': undefined,
        'task#2': undefined,
        'task#3': undefined,
        'task#4': undefined
      })
      done()
    })

    _runner.start()
  })

  test('stop running parallel', done => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })

    _runner.add('task#1', async () => { await helper.deelay(250); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

    _runner.on('task:end', async ({ id }) => {
      if (id === 'task#1') {
        expect(await _runner.stop()).toBe(true)
      }
    })

    _runner.on('run:end', ({ result }) => {
      expect(result.outputs).toEqual({
        'task#1': 1,
        'task#1.1': undefined,
        'task#2': 2
      })
      done()
    })

    _runner.start()
  })

  test('stop but was not running', async () => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })

    expect(await _runner.stop()).toBe(false)
  })
})

describe('Runner.restart', () => {
  test('restart running series', done => {
    const _runner = new macalino.Runner({ running: macalino.running.SERIES })

    let _restarted = false
    _runner.add('task#1', () => { return _restarted ? 10 : 1 })
    _runner.add('task#1.1', () => { return _restarted ? 11 : 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', () => { return _restarted ? 20 : 2 })
    _runner.add('task#3', () => { return _restarted ? 30 : 3 }, { wait: ['task#1', 'task#2'] })

    _runner.once('task:end', async ({ id }) => {
      if (id === 'task#1') {
        _runner.restart()
      }
    })

    _runner.on('run:end', ({ result }) => {
      if (_restarted) {
        expect(result.outputs).toEqual({
          'task#1': 10,
          'task#1.1': 11,
          'task#2': 20,
          'task#3': 30
        })
        done()
      }
      _restarted = true
    })

    _runner.start()
  })

  test('restart running parallel', done => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })

    let _restarted = false
    _runner.add('task#1', async () => { await helper.deelay(50); return _restarted ? 10 : 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(50); return _restarted ? 11 : 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return _restarted ? 20 : 2 })
    _runner.add('task#3', async () => { await helper.deelay(50); return _restarted ? 30 : 3 }, { wait: ['task#1', 'task#2'] })

    _runner.once('task:end', async ({ id }) => {
      if (id === 'task#1') {
        _runner.restart()
      }
    })

    _runner.on('run:end', ({ result }) => {
      if (_restarted) {
        expect(result.outputs).toEqual({
          'task#1': 10,
          'task#1.1': 11,
          'task#2': 20,
          'task#3': 30
        })
        done()
      }
      _restarted = true
    })

    _runner.start()
  })
})

describe('Runner.pause', () => {
  test('pause running series', done => {
    const _runner = new macalino.Runner({ running: macalino.running.SERIES })

    _runner.add('task#1', async () => { await helper.deelay(150); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

    _runner.on('task:end', ({ id }) => {
      if (id === 'task#1') {
        _runner.pause()
        expect(_runner.result().outputs).toEqual({
          'task#1': 1,
          'task#1.1': undefined,
          'task#2': undefined
        })
        done()
      }
    })

    _runner.start()
  })

  test('pause running parallel', done => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })

    _runner.add('task#1', async () => { await helper.deelay(150); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

    _runner.on('task:end', ({ id }) => {
      if (id === 'task#1') {
        _runner.pause()
        expect(_runner.result().outputs).toEqual({
          'task#1': 1,
          'task#1.1': undefined,
          'task#2': 2
        })
        done()
      }
    })

    _runner.start()
  })

  test('pause but was stopped', done => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })

    _runner.add('task#1', async () => { await helper.deelay(150); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

    _runner.on('task:end', ({ id }) => {
      if (id === 'task#1') {
        _runner.stop()

        setTimeout(() => {
          expect(_runner.pause()).toBe(false)
          done()
        }, 100)
      }
    })

    _runner.start()
  })
})

describe('Runner.resume', () => {
  test('resume running series', done => {
    const _runner = new macalino.Runner({ running: macalino.running.SERIES })

    let _resumed = false

    _runner.add('task#1', async () => { await helper.deelay(150); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

    _runner.on('task:end', ({ id }) => {
      if (id === 'task#1') {
        _runner.pause()
        expect(_runner.result().outputs).toEqual({
          'task#1': 1,
          'task#1.1': undefined,
          'task#2': undefined
        })
        _runner.on('task:start', ({ id }) => {
          expect(id).not.toBe('task#1')
        })
        setTimeout(() => {
          _resumed = true
          _runner.resume()
        }, 100)
      }
    })

    _runner.on('run:end', ({ result }) => {
      if (_resumed) {
        expect(result.outputs).toEqual({
          'task#1': 1,
          'task#1.1': 1.1,
          'task#2': 2
        })
        done()
      }
    })

    _runner.start()
  })

  test('resume running parallel', done => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })
    let _resumed = false

    _runner.add('task#1', async () => { await helper.deelay(150); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

    _runner.on('task:end', ({ id }) => {
      if (id === 'task#1') {
        _runner.pause()
        expect(_runner.result().outputs).toEqual({
          'task#1': 1,
          'task#1.1': undefined,
          'task#2': 2
        })
        _runner.on('task:start', ({ id }) => {
          expect(id).not.toBe('task#1')
        })
        setTimeout(() => {
          _resumed = true
          _runner.resume()
        }, 100)
      }
    })

    _runner.on('run:end', ({ result }) => {
      if (_resumed) {
        expect(result.outputs).toEqual({
          'task#1': 1,
          'task#1.1': 1.1,
          'task#2': 2
        })
        done()
      }
    })

    _runner.start()
  })

  test('resume but was stopped', done => {
    const _runner = new macalino.Runner({ running: macalino.running.PARALLEL })

    _runner.add('task#1', async () => { await helper.deelay(150); return 1 })
    _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
    _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

    _runner.on('task:end', ({ id }) => {
      if (id === 'task#1') {
        _runner.stop()

        setTimeout(() => {
          expect(_runner.resume()).toBe(false)
          done()
        }, 100)
      }
    })

    _runner.start()
  })
})
