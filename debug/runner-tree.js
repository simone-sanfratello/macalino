'use strict'

const macalino = require('../src/index')

const debug = async () => {
  const runner = new macalino.Runner()
  const _root = []
  for (let i = 0; i < 10; i++) {
    runner.add('task#' + i, function () { return i }, { wait: i > 0 ? 'task#' + (i - 1) : undefined })
    _root.push({ id: 'task#' + i, nodes: [] })
  }

  const tree = runner.tree()
  console.log(tree)
}

debug()
