'use strict'

const macalino = require('../src/index')
const helper = require('../test/helper')

const debug = async () => {
  const runner = new macalino.Runner()

  const _runs = []

  runner.add('task#1', async () => { await helper.deelay(200); _runs.push('task#1') })
  runner.add('task#1.1', async () => { await helper.deelay(100); _runs.push('task#1.1') }, { wait: 'task#1' })

  runner.add('task#2', async () => { await helper.deelay(50); _runs.push('task#2') })

  runner.add('task#3', async () => { await helper.deelay(50); _runs.push('task#3') }, { wait: ['task#1', 'task#2'] })

  const _tree = runner.tree()
  console.log(_tree)

  await runner.run()
  console.log(_runs)
}

debug()
