'use strict'

const macalino = require('../src/index')
// const toolbox = require('a-toolbox')

const debug = async () => {
  const runner = new macalino.Runner()
  runner.set({ running: macalino.running.SERIES })
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
  console.log(_runs)
}

debug()
