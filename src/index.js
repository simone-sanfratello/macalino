'use strict'

const task = require('./task')

const macalino = {
  Runner: require('./Runner'),
  ...require('./lib/references'),
  promise: require('./lib/promise'),
  single: task.single,
  series: task.series,
  parallel: task.parallel
}

module.exports = macalino
