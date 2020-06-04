'use strict'

const macalino = require('../src/index')
const helper = require('../test/helper')

const debug = async () => {
  const _runner = new macalino.Runner({ log: { level: 'debug', pretty: false }, running: macalino.running.PARALLEL })

  _runner.add('task#1', async () => { await helper.deelay(150); return 1 })
  _runner.add('task#1.1', async () => { await helper.deelay(100); return 1.1 }, { wait: 'task#1' })
  _runner.add('task#2', async () => { await helper.deelay(50); return 2 })

  _runner.on('task:end', ({ id }) => {
    if (id === 'task#1') {
      _runner.pause()
      console.log(_runner.result())
      _runner.on('task:start', ({ id }) => {
        console.log(id)
      })
      _runner.resume()
    }
  })

  _runner.on('run:end', ({ error, result }) => {
    console.log(error)
    console.log(result)
  })

  _runner.start()

}

debug()
