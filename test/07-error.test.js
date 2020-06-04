'use strict'

const macalino = require('../src/index')
const helper = require('./helper')

describe('Error in task single, running series', () => {
  test('sync', async () => {
    const runner = new macalino.Runner({ running: macalino.running.SERIES })

    runner.add('task#1', () => { return 1 })
    runner.add('task#2', () => { throw new Error('something wrong') })
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual(new Error('something wrong'))
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': undefined,
      'task#3': 3,
      'task#4': undefined
    })
  })

  test('async', async () => {
    const runner = new macalino.Runner({ running: macalino.running.SERIES })

    runner.add('task#1', async () => { return 1 })
    runner.add('task#2', async () => { await helper.deelay(10); throw new Error('something wrong') })
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual(new Error('something wrong'))
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': undefined,
      'task#3': 3,
      'task#4': undefined
    })
  })

  test('callback', async () => {
    const runner = new macalino.Runner({ running: macalino.running.SERIES })

    runner.add('task#1', async () => { return 1 })
    runner.add('task#2', macalino.promise.callback(done => { throw new Error('something wrong') }))
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual(new Error('something wrong'))
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': undefined,
      'task#3': 3,
      'task#4': undefined
    })
  })
})

describe('Error in task single, running parallel', () => {
  test('sync', async () => {
    const runner = new macalino.Runner()

    runner.add('task#1', () => { return 1 })
    runner.add('task#2', () => { throw new Error('something wrong') })
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual(new Error('something wrong'))
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': undefined,
      'task#3': 3,
      'task#4': undefined
    })
  })

  test('async', async () => {
    const runner = new macalino.Runner()

    runner.add('task#1', async () => { return 1 })
    runner.add('task#2', async () => { throw new Error('something wrong') })
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual(new Error('something wrong'))
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': undefined,
      'task#3': 3,
      'task#4': undefined
    })
  })

  test('callback', async () => {
    const runner = new macalino.Runner()

    runner.add('task#1', async () => { return 1 })
    runner.add('task#2', macalino.promise.callback(done => { throw new Error('something wrong') }))
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual(new Error('something wrong'))
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': undefined,
      'task#3': 3,
      'task#4': undefined
    })
  })
})

describe('Error in task series, running series', () => {
  test('mixed: sync, async, callback', async () => {
    const runner = new macalino.Runner({ running: macalino.running.SERIES })

    runner.add('task#1', () => { return 1 })
    runner.add('task#2', macalino.series([
      () => { return 2.1 },
      () => { throw new Error('something wrong') },
      macalino.promise.callback(done => { done(null, 2.3) }),
      macalino.promise.callback(done => { throw new Error('something wrong') }),
      async () => { return 2.5 },
      async () => { throw new Error('something wrong') }
    ]))
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual([
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong')
    ])
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': [2.1, undefined, 2.3, undefined, 2.5, undefined],
      'task#3': 3,
      'task#4': undefined
    })
  })
})

describe('Error in task series, running parallel', () => {
  test('mixed: sync, async, callback', async () => {
    const runner = new macalino.Runner()

    runner.add('task#1', () => { return 1 })
    runner.add('task#2', macalino.series([
      () => { return 2.1 },
      () => { throw new Error('something wrong') },
      macalino.promise.callback(done => { done(null, 2.3) }),
      macalino.promise.callback(done => { throw new Error('something wrong') }),
      async () => { return 2.5 },
      async () => { throw new Error('something wrong') }
    ]))
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual([
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong')
    ])
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': [2.1, undefined, 2.3, undefined, 2.5, undefined],
      'task#3': 3,
      'task#4': undefined
    })
  })
})

describe('Error in task parallel, running series', () => {
  test('mixed: sync, async, callback', async () => {
    const runner = new macalino.Runner()

    runner.add('task#1', () => { return 1 })
    runner.add('task#2', macalino.parallel([
      () => { return 2.1 },
      () => { throw new Error('something wrong') },
      macalino.promise.callback(done => { done(null, 2.3) }),
      macalino.promise.callback(done => { throw new Error('something wrong') }),
      async () => { return 2.5 },
      async () => { throw new Error('something wrong') }
    ]))
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual([
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong')
    ])
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': [2.1, undefined, 2.3, undefined, 2.5, undefined],
      'task#3': 3,
      'task#4': undefined
    })
  })
})

describe('Error in task parallel, running parallel', () => {
  test('mixed: sync, async, callback', async () => {
    const runner = new macalino.Runner()

    runner.add('task#1', () => { return 1 })
    runner.add('task#2', macalino.parallel([
      () => { return 2.1 },
      () => { throw new Error('something wrong') },
      macalino.promise.callback(done => { done(null, 2.3) }),
      macalino.promise.callback(done => { throw new Error('something wrong') }),
      async () => { return 2.5 },
      async () => { throw new Error('something wrong') }
    ]))
    runner.add('task#3', () => { return 3 })
    runner.add('task#4', () => { return 4 }, { wait: ['task#2', 'task#3'] })

    const result = await runner.run()

    expect(result.errors['task#2']).toEqual([
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong'),
      undefined,
      new Error('something wrong')
    ])
    expect(result.errors['task#4']).toEqual(new Error('ERROR_FROM_WAITING_TASK:task#2'))
    expect(result.outputs).toEqual({
      'task#1': 1,
      'task#2': [2.1, undefined, 2.3, undefined, 2.5, undefined],
      'task#3': 3,
      'task#4': undefined
    })
  })
})
