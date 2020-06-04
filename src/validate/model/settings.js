'use strict'

const superstruct = require('superstruct')
const default_ = require('../../../settings/default')
const references = require('../../lib/references')

const s = superstruct.struct

const settings = s({
  running: s.optional(s.enum(Object.values(references.running))),
  log: s.optional(s({
    level: s.optional(s.enum(['debug', 'trace', 'info', 'warn', 'error', 'fatal', 'silent'])),
    pretty: 'boolean?',
    version: 'string?',
    singleton: 'boolean?'
  }, default_.log)),
  trace: 'boolean?'
}, default_)

module.exports = settings
