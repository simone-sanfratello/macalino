'use strict'

const draw = {
  tree: function (tree, tasks) {
    return draw.node({ node: tree.root, done: [], tasks }) + '\n'
  },
  node: function ({ node, tasks, done, parent, deep = 0 }) {
    const _output = []
    let _indent = ''
    for (let i = 0; i < deep * 2; i++) {
      _indent += ' '
    }
    for (let i = 0; i < node.length; i++) {
      const _node = node[i]
      if (done.includes(_node.id)) {
        continue
      }
      _output.push(`\n${_indent}- ${_node.id}`)
      if (tasks[_node.id].wait && tasks[_node.id].wait.length > 1) {
        _output.push(' * +wait ', tasks[_node.id].wait.filter(t => t !== parent).join())
      }
      done.push(_node.id)
      if (_node.nodes.length > 0) {
        _output.push(draw.node({ node: _node.nodes, parent: _node.id, done, tasks, deep: deep + 1 }))
      }
    }
    return _output.join('')
  }
}

module.exports = draw
