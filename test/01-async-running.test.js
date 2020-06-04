'use strict'

const macalino = require('../src/index')

describe('async running', () => {
  test('run async tasks series and solve in adding order', async () => {
    const runner = new macalino.Runner({ running: macalino.running.SERIES })
    const _runs = []
    const _tasks = [
      ['task#1', 500],
      ['task#2', 250],
      ['task#3', 100],
      ['task#4', 750],
      ['task#5', 200]
    ]
    const _result = [
      'task#1',
      'task#2',
      'task#3',
      'task#4',
      'task#5'
    ]

    for (const _task of _tasks) {
      runner.add(_task[0], function () {
        return new Promise((resolve) => {
          setTimeout(() => {
            _runs.push(_task[0])
            resolve()
          }, _task[1])
        })
      })
    }

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run async tasks parallel and solve in execution order', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _tasks = [
      ['task#1', 500],
      ['task#2', 250],
      ['task#3', 100],
      ['task#4', 750],
      ['task#5', 200]
    ]
    const _result = [
      'task#3',
      'task#5',
      'task#2',
      'task#1',
      'task#4'
    ]

    for (const _task of _tasks) {
      runner.add(_task[0], function () {
        return new Promise((resolve) => {
          setTimeout(() => {
            _runs.push(_task[0])
            resolve()
          }, _task[1])
        })
      })
    }

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run async tasks series with dependecies and solve in adding order', async () => {
    const runner = new macalino.Runner({ running: macalino.running.SERIES })
    const _runs = []
    const _tasks = [
      ['task#1', 500],
      ['task#2', 250],
      ['task#3', 100],
      ['task#4', 750],
      ['task#5', 200],
      ['task#1.1', 50, { wait: 'task#1' }],
      ['task#1.2', 150, { wait: 'task#1' }],
      ['task#4.1', 100, { wait: 'task#4' }],
      ['task#4.2', 50, { wait: 'task#4' }],
      ['task#1.1.1', 100, { wait: 'task#1.1' }],
      ['task#1.1.2', 80, { wait: 'task#1.1' }],
      ['task#1.2.1', 100, { wait: 'task#1.2' }],
      ['task#1.2.2', 80, { wait: 'task#1.2' }]
    ]
    const _result = [
      'task#1',
      'task#2',
      'task#3',
      'task#4',
      'task#5',
      'task#1.1',
      'task#1.2',
      'task#4.1',
      'task#4.2',
      'task#1.1.1',
      'task#1.1.2',
      'task#1.2.1',
      'task#1.2.2'
    ]

    for (const _task of _tasks) {
      runner.add(_task[0], function () {
        return new Promise((resolve) => {
          setTimeout(() => {
            _runs.push(_task[0])
            resolve()
          }, _task[1])
        })
      }, _task[2])
    }

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run async tasks parallel with dependecies and solve in execution order', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _tasks = [
      ['task#1', 500],
      ['task#2', 250],
      ['task#3', 800],
      ['task#4', 150],
      ['task#5', 200],
      ['task#1.1', 50, { wait: 'task#1' }],
      ['task#1.2', 150, { wait: 'task#1' }],
      ['task#4.1', 100, { wait: 'task#4' }],
      ['task#4.2', 50, { wait: 'task#4' }],
      ['task#1.1.1', 100, { wait: 'task#1.1' }],
      ['task#1.1.2', 450, { wait: 'task#1.1' }],
      ['task#1.2.1', 100, { wait: 'task#1.2' }],
      ['task#1.2.2', 100, { wait: 'task#1.2' }]
    ]
    const _result = [
      'task#4',
      'task#5',
      'task#4.2',
      'task#2',
      'task#4.1',
      'task#1',
      'task#1.1',
      'task#1.2',
      'task#1.1.1',
      'task#1.2.1',
      'task#1.2.2',
      'task#3',
      'task#1.1.2']

    for (const _task of _tasks) {
      runner.add(_task[0], function () {
        return new Promise((resolve) => {
          setTimeout(() => {
            _runs.push(_task[0])
            resolve()
          }, _task[1])
        })
      }, _task[2])
    }

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('run mixed task types with dependecies and solve #1', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', function () {
      _runs.push('task#1')
    })
    runner.add('task#2', {
      running: macalino.task.running.PARALLEL,
      units: [
        async function () { _runs.push('task#2') },
        async function () { _runs.push('task#2') },
        async function () { _runs.push('task#2') },
        async function () { _runs.push('task#2') },
        async function () { _runs.push('task#2') }
      ]
    }, { wait: 'task#1' })
    runner.add('task#3', {
      running: macalino.task.running.SERIES,
      units: [
        function () { _runs.push('task#3') },
        function () { _runs.push('task#3') },
        function () { _runs.push('task#3') },
        function () { _runs.push('task#3') },
        function () { _runs.push('task#3') }
      ]
    }, { wait: 'task#1' })
    runner.add('task#4', function () { _runs.push('task#4') }, { wait: 'task#2' })
    runner.add('task#5', function () { _runs.push('task#5') }, { wait: 'task#3' })

    await runner.run()
    expect(_runs.indexOf('task#4')).toBeGreaterThan(_runs.lastIndexOf('task#2'))
    expect(_runs.indexOf('task#5')).toBe(12)
    expect(_runs.length).toBe(13)
  })

  test('run mixed task types with dependecies and solve #2', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', function () {
      _runs.push('task#1')
    })
    runner.add('task#2', macalino.parallel([
      async function () { _runs.push('task#2') },
      async function () { _runs.push('task#2') },
      async function () { _runs.push('task#2') },
      async function () { _runs.push('task#2') },
      async function () { _runs.push('task#2') }
    ]), { wait: 'task#1' })
    runner.add('task#3', macalino.series([
      async function () { _runs.push('task#3') },
      async function () { _runs.push('task#3') },
      async function () { _runs.push('task#3') },
      async function () { _runs.push('task#3') },
      async function () { _runs.push('task#3') }
    ]), { wait: 'task#1' })
    runner.add('task#4', function () { _runs.push('task#4') }, { wait: 'task#2' })
    runner.add('task#5', function () { _runs.push('task#5') }, { wait: 'task#1' })

    await runner.run()
    expect(_runs.indexOf('task#4')).toBeGreaterThan(_runs.lastIndexOf('task#2'))
    expect(_runs.indexOf('task#5')).toBeGreaterThan(_runs.lastIndexOf('task#1'))
    expect(_runs.length).toBe(13)
  })
})

describe('run multiple instances', () => {
  test('run same tasks in series and parallel', async () => {
    const _runner = {
      series: new macalino.Runner({ running: macalino.running.SERIES, log: { level: 'trace' } }),
      parallel: new macalino.Runner({ log: { level: 'silent' } })
    }
    const _runs = []

    for (const _type of ['series', 'parallel']) {
      _runner[_type].add('task#1', function () { _runs.push(_type + '|task#1') })
      _runner[_type].add('task#2', {
        running: macalino.task.running.PARALLEL,
        units: [
          async function () { _runs.push(_type + '|task#2') },
          async function () { _runs.push(_type + '|task#2') },
          async function () { _runs.push(_type + '|task#2') },
          async function () { _runs.push(_type + '|task#2') },
          async function () { _runs.push(_type + '|task#2') }
        ]
      }, { wait: 'task#1' })
      _runner[_type].add('task#3', {
        running: macalino.task.running.SERIES,
        units: [
          function () { _runs.push(_type + '|task#3') },
          function () { _runs.push(_type + '|task#3') },
          function () { _runs.push(_type + '|task#3') },
          function () { _runs.push(_type + '|task#3') },
          function () { _runs.push(_type + '|task#3') }
        ]
      }, { wait: 'task#1' })
      _runner[_type].add('task#4', function () { _runs.push(_type + '|task#4') }, { wait: 'task#2' })
      _runner[_type].add('task#5', function () { _runs.push(_type + '|task#5') }, { wait: 'task#3' })
    }

    await Promise.all([_runner.series.run(), _runner.parallel.run()])
    expect(_runs.length).toBe(26)
    expect(_runs.indexOf('series|task#1')).toBe(0)
    expect(_runs.lastIndexOf('series|task#5')).toBe(25)
  })
})
