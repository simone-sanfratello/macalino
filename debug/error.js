'use strict'

const macalino = require('../src/index')
// const helper = require('../test/helper')

const debug = async () => {
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

  console.log(result)
}

debug()
