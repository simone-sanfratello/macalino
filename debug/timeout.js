'use strict'

const macalino = require('../src/index')
// const helper = require('../test/helper')

const debug = async () => {
  const runner = new macalino.Runner()
  runner.add('task#1', () => {
    for (let i = 0; i < 99999; i++) {
      // sigh
    }
    return 1
  }, { timeout: 5 })
  const result = await runner.run()
  console.log(result)
}

debug()
