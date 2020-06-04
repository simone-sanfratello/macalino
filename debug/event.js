'use strict'

const macalino = require('../src/index')
const EventEmitter = require('events')

const debug = async () => {
  const runner = new macalino.Runner()
  const _runs = []

  const emitter = new EventEmitter()

  runner.add('task#3', macalino.promise.event(emitter, 'single'))

  runner.add('task#1', {
    running: macalino.task.running.PARALLEL,
    units: [
      function () { _runs.push(10) },
      async function () { _runs.push(11) },
      macalino.promise.event(macalino.promise.event(emitter, 'parallel'))
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

  setTimeout(() => {
    emitter.emit('single')
    emitter.emit('series')
    emitter.emit('parallel')
  }, 500)

  await runner.run()

  console.log(_runs)
}

debug()
