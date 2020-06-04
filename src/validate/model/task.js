'use strict'

const superstruct = require('superstruct')
const references = require('../../lib/references')
const s = superstruct.struct

const job = s({
  running: s.optional(s.enum(Object.values(references.task.running))),
  units: s.union(['function', ['function']])
})

const options = s({
  wait: s.union(['string?', ['string']]),
  skip: 'boolean?',
  only: 'boolean?',
  timeout: 'number'
})

const task = s({
  id: 'string',
  task: s.union(['function', job]),
  options: s.optional(options)
})

module.exports = task
