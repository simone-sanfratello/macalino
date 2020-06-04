'use strict'

const macalino = require('../src/index')
const helper = require('./helper')
const references = require('../src/lib/references')

describe('Runner.run option skip', () => {
  test('simple skip', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(100); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') })

    await runner.run({ skip: 'task#1' })

    expect(_runs).toEqual(['task#2'])
  })

  test('skip task but include instead because other task has as dependency', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1' })
    runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2' })

    await runner.run({ skip: ['task#1', 'task#2'] })

    expect(_runs).toEqual(['task#1', 'task#2', 'task#3'])
  })

  test('skip tasks and skip again, but include because other tasks have dependencies', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') }, { skip: true })
    runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1' })
    runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2' })
    runner.add('task#4', async () => { await helper.deelay(55); _runs.push('task#4') })

    await runner.run({ skip: 'task#1' })

    expect(_runs).toEqual(['task#1', 'task#4', 'task#2', 'task#3'])
  })
})

describe('Runner.add option only', () => {
  test('simple only', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(100); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') })

    await runner.run({ only: 'task#2' })

    expect(_runs).toEqual(['task#2'])
  })

  test('only task and include dependencies', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1' })
    runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2' })

    await runner.run({ only: 'task#3' })

    expect(_runs).toEqual(['task#1', 'task#2', 'task#3'])
  })
})

describe('Runner.add option only and skip mixed', () => {
  test('simple only and skip', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(100); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') })

    await runner.run({ skip: 'task#1', only: 'task#2' })

    expect(_runs).toEqual(['task#2'])
  })

  test('only task and include skipped dependencies', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1' })
    runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2' })
    runner.add('task#4', async () => { await helper.deelay(55); _runs.push('task#1') })

    await runner.run({ skip: 'task#1', only: 'task#2' })

    expect(_runs).toEqual(['task#1', 'task#2'])
  })
})

describe('Runner.add option timeout', () => {
  test('default timeout', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', async () => { await helper.deelay(references.TIMEOUT_LIMIT + 200); return 1 })
    const result = await runner.run()
    expect(result.errors['task#1']).toEqual(new Error('TIMEOUT:' + references.TIMEOUT_LIMIT))
  }, references.TIMEOUT_LIMIT + 1000)

  test('custom timeout', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', async () => { await helper.deelay(200); return 1 }, { timeout: 100 })
    const result = await runner.run()
    expect(result.errors['task#1']).toEqual(new Error('TIMEOUT:100'))
  })

  test('timeout for sync function', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', () => {
      for (let i = 0; i < 999999; i++) {
        // sigh
      }
      return 1
    }, { timeout: 1 })
    const result = await runner.run()
    expect(result.outputs['task#1']).toBeUndefined()
    expect(result.errors['task#1']).toEqual(new Error('TIMEOUT:1'))
  })

  test('multiple timeout', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', async () => { await helper.deelay(250); return 1 }, { timeout: 100 })
    runner.add('task#2', async () => { await helper.deelay(250); return 2 }, { timeout: 100 })
    const result = await runner.run()
    expect(result.errors['task#1']).toEqual(new Error('TIMEOUT:100'))
    expect(result.errors['task#2']).toEqual(new Error('TIMEOUT:100'))
  })

  test('no timeout', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', async () => { await helper.deelay(references.TIMEOUT_LIMIT + 200); return 1 }, { timeout: -1 })
    const result = await runner.run()
    expect(result.outputs['task#1']).toEqual(1)
  }, references.TIMEOUT_LIMIT + 1000)

  test('timeout for series', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', macalino.series([
      async () => { await helper.deelay(200); return false },
      async () => { return true },
      async () => { await helper.deelay(200); return false }
    ]), { timeout: 100 })
    const result = await runner.run()
    expect(result.errors['task#1'][0]).toEqual(new Error('TIMEOUT:100'))
    expect(result.errors['task#1'][1]).toBeUndefined()
    expect(result.errors['task#1'][2]).toEqual(new Error('TIMEOUT:100'))
  })

  test('timeout for parallel', async () => {
    const runner = new macalino.Runner()
    runner.add('task#1', macalino.parallel([
      async () => { await helper.deelay(200); return false },
      async () => { return true },
      async () => { await helper.deelay(200); return false }
    ]), { timeout: 100 })
    const result = await runner.run()
    expect(result.errors['task#1'][0]).toEqual(new Error('TIMEOUT:100'))
    expect(result.errors['task#1'][1]).toBeUndefined()
    expect(result.errors['task#1'][2]).toEqual(new Error('TIMEOUT:100'))
  })
})
