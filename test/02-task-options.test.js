'use strict'

const macalino = require('../src/index')
const helper = require('./helper')

describe('Runner.add option wait', () => {
  test('simple dependency', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _result = [
      'task#2',
      'task#1',
      'task#1.1'
    ]

    runner.add('task#1', async () => { await helper.deelay(200); _runs.push('task#1') })
    runner.add('task#1.1', async () => { await helper.deelay(100); _runs.push('task#1.1') }, { wait: 'task#1' })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') })

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('multiple dependency', async () => {
    const runner = new macalino.Runner()
    const _runs = []
    const _result = [
      'task#2',
      'task#1',
      'task#1.1',
      'task#3'
    ]

    runner.add('task#1', async () => { await helper.deelay(200); _runs.push('task#1') })
    runner.add('task#1.1', async () => { await helper.deelay(100); _runs.push('task#1.1') }, { wait: 'task#1' })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') })
    runner.add('task#3', async () => { await helper.deelay(150); _runs.push('task#3') }, { wait: ['task#1', 'task#2'] })

    const _tree = runner.tree()
    expect(_tree).toEqual({ root: [{ id: 'task#1', nodes: [{ id: 'task#1.1', nodes: [] }, { id: 'task#3', nodes: [] }] }, { id: 'task#2', nodes: [{ id: 'task#3', nodes: [] }] }] })

    await runner.run()
    expect(_runs).toEqual(_result)
  })

  test('cascade dependency', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(50); _runs.push('task#1') })
    runner.add('task#1.1', async () => { await helper.deelay(50); _runs.push('task#1.1') }, { wait: 'task#1' })
    runner.add('task#1.1.1', async () => { await helper.deelay(10); _runs.push('task#1.1.1') }, { wait: 'task#1.1' })
    runner.add('task#1.1.2', async () => { await helper.deelay(10); _runs.push('task#1.1.1') }, { wait: 'task#1.1' })
    runner.add('task#2', async () => { await helper.deelay(10); _runs.push('task#2') })
    runner.add('task#2.1', async () => { await helper.deelay(10); _runs.push('task#2.1') }, { wait: 'task#2' })
    runner.add('task#2.1.1', async () => { await helper.deelay(10); _runs.push('task#2.1.1') }, { wait: 'task#2.1' })
    runner.add('task#2.1.2', async () => { await helper.deelay(10); _runs.push('task#2.1.2') }, { wait: 'task#2.1' })
    runner.add('task#2.1.1.1', async () => { await helper.deelay(10); _runs.push('task#2.1.1.1') }, { wait: 'task#2.1.1' })
    runner.add('task#2.1.2.1', async () => { await helper.deelay(10); _runs.push('task#2.1.2.1') }, { wait: 'task#2.1.2' })

    const _tree = runner.tree()
    expect(_tree).toEqual({ root: [{ id: 'task#1', nodes: [{ id: 'task#1.1', nodes: [{ id: 'task#1.1.1', nodes: [] }, { id: 'task#1.1.2', nodes: [] }] }] }, { id: 'task#2', nodes: [{ id: 'task#2.1', nodes: [{ id: 'task#2.1.1', nodes: [{ id: 'task#2.1.1.1', nodes: [] }] }, { id: 'task#2.1.2', nodes: [{ id: 'task#2.1.2.1', nodes: [] }] }] }] }] })

    await runner.run()
    expect(_runs).toEqual([
      'task#2',
      'task#2.1',
      'task#2.1.1',
      'task#2.1.2',
      'task#2.1.1.1',
      'task#2.1.2.1',
      'task#1',
      'task#1.1',
      'task#1.1.1',
      'task#1.1.1'
    ])
  })
})

describe('Runner.add option skip', () => {
  test('simple skip', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(100); _runs.push('task#1') }, { skip: true })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') })

    await runner.run()

    expect(_runs).toEqual(['task#2'])
  })

  test('skip task but include instead because other task has as dependency', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') }, { skip: true })
    runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1', skip: true })
    runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2' })
    runner.add('task#4', async () => { await helper.deelay(55); _runs.push('task#4') }, { wait: 'task#3' })

    await runner.run()

    expect(_runs).toEqual(['task#1', 'task#2', 'task#3', 'task#4'])
  })
})

describe('Runner.add option only', () => {
  test('simple only', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(100); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') }, { only: true })

    await runner.run()

    expect(_runs).toEqual(['task#2'])
  })

  test('only task and include dependencies', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') })
    runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1' })
    runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2', only: true })

    await runner.run()

    expect(_runs).toEqual(['task#1', 'task#2', 'task#3'])
  })
})

describe('Runner.add option only and skip mixed', () => {
  test('simple only and skip', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(100); _runs.push('task#1') }, { skip: true })
    runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') }, { only: true })

    await runner.run()

    expect(_runs).toEqual(['task#2'])
  })

  test('only task and include skipped dependencies', async () => {
    const runner = new macalino.Runner()
    const _runs = []

    runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') }, { skip: true })
    runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1' })
    runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2', only: true, skip: true })
    runner.add('task#4', async () => { await helper.deelay(55); _runs.push('task#1') })

    await runner.run()

    expect(_runs).toEqual(['task#1', 'task#2', 'task#3'])
  })
})
