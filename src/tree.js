'use strict'

const tree = {
  /**
   * get node by id in tree, traversing breadth
   * @todo check circularity
   * @param {Tree} tree
   * @param {string} id
   * @return {TreeNode|null} - get the node or null if not found
   */
  node: function (tree, id) {
    let todo = [tree.root]
    while (todo.length > 0) {
      const next = []
      for (let i = 0; i < todo.length; i++) {
        for (let j = 0; j < todo[i].length; j++) {
          const current = todo[i][j]
          if (current.id === id) {
            return current
          }
          if (current.nodes.length > 0) {
            next.push(current.nodes)
          }
        }
      }
      todo = next
    }

    return null
  }
}

module.exports = tree
