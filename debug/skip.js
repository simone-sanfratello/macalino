'use strict'

const macalino = require('../src/index')
const helper = require('../test/helper')

const debug = async () => {
  const runner = new macalino.Runner()
  const _runs = []

  runner.add('task#1', async () => { await helper.deelay(55); _runs.push('task#1') }, { skip: true })
  runner.add('task#2', async () => { await helper.deelay(55); _runs.push('task#2') }, { wait: 'task#1', skip: true })
  runner.add('task#3', async () => { await helper.deelay(55); _runs.push('task#3') }, { wait: 'task#2' })

  await runner.run()

  console.log(_runs)
}

debug()
