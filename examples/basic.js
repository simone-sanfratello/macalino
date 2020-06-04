'use strict'

const m = require('../src/index')

const deelay = function (ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms)
  })
}

const runAsyncTasks = async function () {
  const runner = new m.Runner()

  runner.add('task#1', async () => { await deelay(200); console.log('task 1 done') })
  runner.add('task#1.1', async () => { await deelay(100); console.log('task 1.1 done') }, { wait: 'task#1' })

  runner.add('task#2', async () => { await deelay(50); console.log('task 2 done') })

  runner.add('task#3', async () => { await deelay(50); console.log('task 3 done') }, { wait: ['task#1', 'task#2'] })

  await runner.run()

  console.log('all tasks done')
}

runAsyncTasks()

const runSyncTasks = async function () {
  const runner = new m.Runner()

  runner.add('task#1', () => console.log('task 1 done'))
  runner.add('task#1.1', () => console.log('task 1.1 done'), { wait: 'task#1' })

  runner.add('task#2', () => console.log('task 2 done'))

  runner.add('task#3', () => console.log('task 3 done'), { wait: ['task#1', 'task#2'] })

  await runner.run()

  console.log('all done')
}

runSyncTasks()
