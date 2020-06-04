'use strict'

const macalino = require('../src/index')

describe('draw.tree', () => {
  test('draw simple task tree', () => {
    const runner = new macalino.Runner()

    runner.add('task#1', () => { })
    runner.add('task#2', () => { })
    runner.add('task#3', () => { })
    runner.add('task#4', () => { }, { wait: ['task#2', 'task#3'] })
    runner.add('task#5', () => { }, { wait: 'task#4' })
    runner.add('task#6', () => { }, { wait: 'task#3' })
    const _draw = `
- task#1
- task#2
  - task#4 * +wait task#3
    - task#5
- task#3
  - task#6
`
    expect(runner.draw()).toEqual(_draw)
  })

  test('draw big task tree', () => {
    const runner = new macalino.Runner()

    runner.add('task#1', () => { })
    runner.add('task#1.1', () => { }, { wait: 'task#1' })
    runner.add('task#1.1.1', () => { }, { wait: 'task#1.1' })
    runner.add('task#1.1.2', () => { }, { wait: 'task#1.1' })
    runner.add('task#2', () => { })
    runner.add('task#2.1', () => { }, { wait: 'task#2' })
    runner.add('task#2.1.1', () => { }, { wait: 'task#2.1' })
    runner.add('task#2.1.2', () => { }, { wait: 'task#2.1' })
    runner.add('task#2.1.1.1', () => { }, { wait: 'task#2.1.1' })
    runner.add('task#2.1.2.1', () => { }, { wait: 'task#2.1.2' })

    const _draw = `
- task#1
  - task#1.1
    - task#1.1.1
    - task#1.1.2
- task#2
  - task#2.1
    - task#2.1.1
      - task#2.1.1.1
    - task#2.1.2
      - task#2.1.2.1
`
    runner.tree()
    expect(runner.draw()).toEqual(_draw)
  })
})
