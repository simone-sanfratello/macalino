'use strict'

const util = require('util')

const promise = {
  callback: function (f) {
    // @todo in browser?
    return util.promisify(f)
  },
  event: function (emitter, event) {
    let done

    emitter.once(event, (data) => {
      done(data)
    })

    return function () {
      return new Promise(resolve => {
        done = resolve
      })
    }
  },
  timeout: async function (f, ms) {
    if (ms < 0) {
      return f()
    }
    const _start = Date.now()
    const _result = await f()
    if (Date.now() - _start > ms) {
      throw new Error('TIMEOUT:' + ms)
    }
    return _result
  }
}

module.exports = promise
