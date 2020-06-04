'use strict'

const superstruct = require('superstruct')

const s = superstruct.struct

const options = s({
  only: s.union(['string?', ['string?']]),
  skip: s.union(['string?', ['string?']]),
  timeout: 'number?'
})

module.exports = options
