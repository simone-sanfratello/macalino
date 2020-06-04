'use strict'

const helper = {
  deelay: function (ms) {
    return new Promise(resolve => {
      setTimeout(resolve, ms)
    })
  }
}

module.exports = helper
