'use strict'

const EventEmitter = require('events')
const macalino = require('../src/index')
const helper = require('./helper')

describe('Runner.add', () => {
  test('add the simplest task', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { console.log('Hey'); return 'this will be ignored' })

    const task = runner.task('task#1')
    expect(task.running).toBe(macalino.task.running.SINGLE)
    expect(typeof task.units).toBe('function')

    const tree = runner.tree()
    expect(tree).toEqual({
      root: [{ id: 'task#1', nodes: [] }]
    })
  })

  test('add task with same id', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { console.log('Hey') })
    runner.add('task#1', function () { return 'I am the captain now' })

    const task = runner.task('task#1')
    expect(task.running).toBe(macalino.task.running.SINGLE)
    expect(task.units()).toBe('I am the captain now')

    const tree = runner.tree()
    expect(tree).toEqual({
      root: [{ id: 'task#1', nodes: [] }]
    })
  })

  test('add invalid task (missing unit) and get thrown error', () => {
    const runner = new macalino.Runner()
    try {
      runner.add('task#1', null)
    } catch (error) {
      expect(error.message).toEqual('Expected a value of type `function | {running,units}` for `task` but received `null`.')
    }
  })

  test('add invalid task (missing id) and get thrown error', () => {
    const runner = new macalino.Runner()
    try {
      runner.add(null, function () { return 'I am the captain now' })
    } catch (error) {
      expect(error.message).toEqual('Expected a value of type `string` for `id` but received `null`.')
    }
  })

  test('add invalid task (wait for itself) and get thrown error', () => {
    const runner = new macalino.Runner()
    try {
      runner.add('task#1', function () {}, { wait: 'task#1' })
    } catch (error) {
      expect(error.message).toEqual('Task cant wait for itself')
    }
  })

  test('add invalid task (wait for not existing task) and get thrown error at build', () => {
    const runner = new macalino.Runner()
    try {
      runner.add('task#1', function () {}, { wait: 'none' })
      runner.build()
    } catch (error) {
      expect(error.message).toBe('Task wait not existing one: none')
    }
  })

  test('add task series', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', {
      running: macalino.task.running.SERIES,
      units: [
        function () { return 1 },
        async function () { return 2 },
        function () { return 3 },
        async function () { return 4 },
        function () { return 5 }
      ]
    })

    const task = runner.task('task#1')
    expect(task.running).toBe(macalino.task.running.SERIES)
  })

  test('add task parallel', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', {
      running: macalino.task.running.PARALLEL,
      units: [
        function () { return 1 },
        async function () { return 2 },
        function () { return 3 },
        async function () { return 4 },
        function () { return 5 }
      ]
    })

    const task = runner.task('task#1')
    expect(task.running).toBe(macalino.task.running.PARALLEL)
  })
})

describe('Runner.task', () => {
  test('get the simplest task', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { return 'useless return' })

    const task = runner.task('task#1')
    expect(task.running).toBe(macalino.task.running.SINGLE)
    expect(typeof task.units).toBe('function')
  })

  test('get null by not existing id', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { return 'useless return' })

    const task = runner.task('none')
    expect(task).toBe(null)
  })
})

describe('Runner.remove', () => {
  test('add 2 task and remove 1', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { return 1 })
    runner.add('task#2', function () { return 2 })

    runner.remove('task#2')

    let task = runner.task('task#2')
    expect(task).toBe(null)

    task = runner.task('task#1')
    expect(task).toBeDefined()
  })

  test('remove not existing id - do nothing', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { return 1 })
    runner.add('task#2', function () { return 2 })

    runner.remove('none')

    const task = runner.task('none')
    expect(task).toBe(null)
  })
})

describe('Runner.reset', () => {
  test('add some task then reset', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { return 1 })
    runner.add('task#2', function () { return 2 })
    runner.add('task#3', function () { return 3 })
    runner.add('task#4', function () { return 4 })

    runner.reset()

    const tree = runner.tree()
    expect(tree).toEqual({ root: [] })
  })
})

describe('Runner.tree', () => {
  test('many tasks with no dependencies', () => {
    const runner = new macalino.Runner()
    const _root = []
    for (let i = 0; i < 100; i++) {
      runner.add('task#' + i, function () { return i })
      _root.push({ id: 'task#' + i, nodes: [] })
    }

    const tree = runner.tree()
    expect(tree.root).toEqual(_root)
  })

  test('many tasks with dependencies', () => {
    const runner = new macalino.Runner()
    for (let i = 0; i < 10; i++) {
      runner.add('task#' + i, function () { return i }, { wait: i > 0 ? 'task#' + (i - 1) : undefined })
    }
    const tree = runner.tree()
    expect(tree).toEqual({ root: [{ id: 'task#0', nodes: [{ id: 'task#1', nodes: [{ id: 'task#2', nodes: [{ id: 'task#3', nodes: [{ id: 'task#4', nodes: [{ id: 'task#5', nodes: [{ id: 'task#6', nodes: [{ id: 'task#7', nodes: [{ id: 'task#8', nodes: [{ id: 'task#9', nodes: [] }] }] }] }] }] }] }] }] }] }] })
  })

  test('many tasks, build, reset and rebuild', () => {
    const runner = new macalino.Runner()
    for (let i = 0; i < 10; i++) {
      runner.add('task#' + i, function () { return i })
    }

    runner.tree()
    runner.reset()
    const tree = runner.tree()
    expect(tree).toEqual({ root: [] })
  })

  test('many tasks with dependencies, remove a dependency and get errror', () => {
    const runner = new macalino.Runner()
    for (let i = 0; i < 10; i++) {
      runner.add('task#' + i, function () { return i }, { wait: i > 0 ? 'task#' + (i - 1) : undefined })
    }

    runner.tree()
    runner.remove('task#1')

    try {
      runner.tree()
    } catch (error) {
      expect(error.message).toBe('Task wait not existing one: task#1')
    }
  })

  test('call twice', () => {
    const runner = new macalino.Runner()
    runner.add('task#1', function () { return 1 })
    runner.tree()
    const tree = runner.tree()
    expect(tree).toEqual({ root: [{ id: 'task#1', nodes: [] }] })
  })
})

describe('Runner.run', () => {
  test('run sequentially many tasks with no dependencies', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _result = []
    for (let i = 0; i < 10; i++) {
      runner.add('task#' + i, function () { _runs.push(i) })
      _result.push(i)
    }

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run sequentially many tasks with dependencies', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _result = []
    for (let i = 0; i < 10; i++) {
      runner.add('task#' + i, function () { _runs.push(i) }, { wait: i > 0 ? 'task#' + (i - 1) : undefined })
      _result.push(i)
    }

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run task series', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _result = [1, 2, 3, 4, 5]
    runner.add('task#1', {
      running: macalino.task.running.SERIES,
      units: [
        function () { _runs.push(1) },
        async function () { _runs.push(2) },
        function () { _runs.push(3) },
        async function () { _runs.push(4) },
        function () { _runs.push(5) }
      ]
    })

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run task parallel', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _result = [2, 3, 4, 5, 1]
    runner.add('task#1', {
      running: macalino.task.running.PARALLEL,
      units: [
        function () {
          return new Promise(resolve => setTimeout(() => {
            _runs.push(1); resolve()
          }, 100))
        },
        async function () { _runs.push(2) },
        function () { _runs.push(3) },
        async function () { _runs.push(4) },
        function () { _runs.push(5) }
      ]
    })

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run tasks with callbacks', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', {
      running: macalino.task.running.PARALLEL,
      units: [
        function () { _runs.push(10) },
        async function () { _runs.push(11) },
        macalino.promise.callback((done) => {
          setTimeout(() => { _runs.push(12); done() }, 200)
        })
      ]
    })

    runner.add('task#2', {
      running: macalino.task.running.SERIES,
      units: [
        function () { _runs.push(20) },
        async function () { _runs.push(21) },
        macalino.promise.callback((done) => {
          setTimeout(() => { _runs.push(22); done() }, 200)
        })
      ]
    })

    runner.add('task#3', macalino.promise.callback((done) => {
      setTimeout(() => { _runs.push(30); done() }, 500)
    })
    )

    await runner.run()
    expect(_runs).toEqual([10, 11, 20, 21, 12, 22, 30])
  })

  test('run tasks with events', async () => {
    const runner = new macalino.Runner()
    const emitter = new EventEmitter()
    const _runs = []

    runner.add('task#1', {
      running: macalino.task.running.PARALLEL,
      units: [
        function () { _runs.push(10) },
        async function () { _runs.push(11) },
        macalino.promise.event(emitter, 'parallel')
      ]
    })

    runner.add('task#2', {
      running: macalino.task.running.SERIES,
      units: [
        function () { _runs.push(20) },
        async function () { _runs.push(21) },
        macalino.promise.event(emitter, 'series')
      ]
    })

    runner.add('task#3', macalino.promise.event(emitter, 'single'))

    setTimeout(() => {
      emitter.emit('single')
      emitter.emit('series')
      emitter.emit('parallel')
    }, 100)

    await runner.run()

    expect(_runs).toEqual([10, 11, 20, 21])
  })

  test('run tasks and collect results', async () => {
    const runner = new macalino.Runner()
    const emitter = new EventEmitter()

    runner.add('task#1', {
      running: macalino.task.running.PARALLEL,
      units: [
        macalino.promise.event(emitter, 'parallel'),
        function () { return 2 },
        async function () { return 3 }
      ]
    })

    runner.add('task#2', {
      running: macalino.task.running.SERIES,
      units: [
        function () { return 1 },
        async function () { return 2 },
        macalino.promise.event(emitter, 'series')
      ]
    })

    runner.add('task#3', macalino.promise.event(emitter, 'single'))
    runner.add('task#3.1', () => 2, { wait: 'task#3' })

    setTimeout(() => {
      emitter.emit('single', 1)
      emitter.emit('series', 1)
      emitter.emit('parallel', 1)
    }, 100)

    await runner.run()

    expect(runner.result().outputs).toEqual({
      'task#1': [1, 2, 3],
      'task#2': [1, 2, 1],
      'task#3': 1,
      'task#3.1': 2
    })
  })

  test('run without tasks', async () => {
    const runner = new macalino.Runner()
    expect(await runner.run()).toEqual({ errors: {}, outputs: {} })
  })

  test('run with "skip" option', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', () => {})
    expect(await runner.run({ skip: 'task#1' })).toEqual({ errors: {}, outputs: {} })
  })

  test('run with "only" option', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', () => {})
    runner.add('task#2', () => {})
    expect(await runner.run({ only: 'task#1' })).toEqual({ errors: {}, outputs: { 'task#1': undefined } })
  })

  test('run with "timeout" option', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', async () => { await helper.deelay(50); return 'ok' })
    runner.add('task#2', async () => { return 'ok' })
    runner.add('task#3', async () => { await helper.deelay(200); return 'no' })

    expect(await runner.run({ timeout: 100 })).toEqual({
      errors: {
        'task#1': undefined,
        'task#2': undefined,
        'task#3': new Error('TIMEOUT:100')
      },
      outputs: {
        'task#1': 'ok',
        'task#2': 'ok',
        'task#3': undefined
      }
    })
  })
})

describe('Runner.set', () => {
  test('set again all settings', async () => {
    const runner = new macalino.Runner()
    runner.set({ running: macalino.running.SERIES, log: { level: 'info' } })
  })

  test('set again log setting', async () => {
    const runner = new macalino.Runner()
    runner.set({ log: { level: 'info' } })
  })

  test('set again running setting', async () => {
    const runner = new macalino.Runner()
    runner.set({ running: macalino.running.SERIES })
  })
})
