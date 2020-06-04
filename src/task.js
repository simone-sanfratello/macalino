'use strict'

const references = require('./lib/references')
const validate = require('./validate')

const t = {
  /**
   * check if task is valid
   * rules:
   * - need id
   * - need task as function or task { running, units }
   * - cant wait for itself
   */
  check: function (id, task, options) {
    if (options.timeout === undefined) {
      options.timeout = references.TIMEOUT_LIMIT
    }
    validate.task({ id, task, options })
    if (options.wait === id) {
      throw new Error('Task cant wait for itself')
    }
    if (options.wait && !Array.isArray(options.wait)) {
      options.wait = [options.wait]
    }
    if (options.only && options.skip) {
      delete options.skip
    }
    if (typeof task === 'function') {
      return t.single(task)
    }
    return task
  },
  single: function (function_) {
    return {
      running: references.task.running.SINGLE,
      units: function_
    }
  },
  series: function (functions) {
    return {
      running: references.task.running.SERIES,
      units: functions
    }
  },
  parallel: function (functions) {
    return {
      running: references.task.running.PARALLEL,
      units: functions
    }
  }
}

module.exports = t
