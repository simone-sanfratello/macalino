'use strict'

const EventEmitter = require('events')
const toolbox = {
  array: require('a-toolbox/array')
}
const log = require('peppino')
const default_ = require('../settings/default')
const references = require('./lib/references')
const promise = require('./lib/promise')
const draw = require('./lib/draw')
const validate = require('./validate')
const task = require('./task')
const tree = require('./tree')

class Runner {
  /**
   * Class runner
   * @throw error if settings are not valid
   * @param {RunnerSettings?} settings
   * @param {Running?} [settings.running=running.PARALLEL]
   * @param {Log?} [settings.log={level: 'warn', pretty: false}]
   * @param {boolean?} [settings.trace=false] enable task time tracking
   */
  constructor (settings = default_) {
    settings = validate.settings(settings)
    this._log = log.init(settings.log)
    this._log.trace({ ns: 'macalino', m: 'new instance' })
    this._log.debug({ ns: 'macalino', m: 'new instance', settings })
    this._settings = { ...settings }
    // task index [id]: task
    this._tasks = {}
    // queue for collect tasks in order when added
    this._queue = []
    // task dependencies tree
    this._tree = null
    this._state = references.state.INIT
    this._select = references.select.NONE
    this._emitter = new EventEmitter()
  }

  /**
   * update settings
   * @param {Running?} [settings.running=running.PARALLEL]
   * @param {boolean?} [settings.trace=false] enable task time tracking
   */
  set (settings) {
    this._log.trace({ ns: 'macalino', m: 'runner set' })
    this._log.debug({ ns: 'macalino', m: 'runner set', settings })
    validate.settings(settings)
    if (settings.log) {
      this._log.set(settings.log)
    }
    Object.assign(this._settings, settings)
  }

  /**
   * add a task
   * replace (with warning) if id already exists
   * @throw error if id or task are invalid
   * @throw error if task.wait for itself
   * @param {string} id
   * @param {Task} task_
   * @param {TaskOptions} options
   * @param {Id|Id[]} options.wait - start after the execution end of this/these task/s
   * @param {boolean?} options.skip - don't execute this task. This option will be ignore if there are other task that are waiting for this
   * @param {boolean?} options.only - execute only this task and other task with `only` option. This option override the `skip` one
   * @param {number?} [options.timeout=5000] - maximum execution time for the task (ms). If task execution execeed, will throw an error TIMEOUT
   *  -1 for no timeout limit.
   *  series and parallel count timeout for each subtask
   */
  add (id, task_, options = {}) {
    this._log.trace({ ns: 'macalino', m: 'runner add', id })
    this._log.debug({ ns: 'macalino', m: 'runner add task', id, task, options })
    const _task = task.check(id, task_, options)

    if (this._select !== references.select.ONLY && options.only) {
      this._select = references.select.ONLY
    } else if (this._select !== references.select.SKIP && options.skip) {
      this._select = references.select.SKIP
    }
    // replace if already exists
    if (this._tasks[id]) {
      this._log.warn({ ns: 'macalino', m: 'task id ' + id + 'already exists, will be replaced' })
      toolbox.array.remove(this._queue, id)
    }

    this._tasks[id] = {
      ..._task,
      ...options
    }

    this._queue.push(id)
    this._tree = null
  }

  /**
   * get task by id
   * @param {string} id
   * @return {Task|null} task or null
   * @safe
   */
  task (id) {
    this._log.trace({ ns: 'macalino', m: 'get task', id })
    return this._tasks[id] || null
  }

  /**
   * remove the task by id
   * @param {string} id
   * @safe
   */
  remove (id) {
    this._log.trace({ ns: 'macalino', m: 'runner remove task', id })
    if (!this._tasks[id]) {
      return
    }
    delete this._tasks[id]
    toolbox.array.remove(this._queue, id)
    this._tree = null
  }

  /**
   * clear tasks and current state
   * @safe
   */
  reset () {
    this._log.trace({ ns: 'macalino', m: 'runner reset' })
    this._log.debug({ ns: 'macalino', m: 'runner reset' })
    this._queue = []
    this._tasks = {}
    this._tree = null
  }

  /**
   * get tree of current tasks
   * @safe
   */
  tree () {
    this._log.trace({ ns: 'macalino', m: 'runner tree' })
    if (!this._tree) {
      this.build()
    }
    this._log.debug({ ns: 'macalino', m: 'runner tree', tree: this._tree })
    return this._tree
  }

  /**
   * events:
   * - run:start
   * - run:end({result: {outputs, errors}})
   * - task:start({id})
   * - task:end({id, output, error})
   * @todo doc
   * @safe
   */
  on (...args) {
    return this._emitter.on(...args)
  }

  /**
   * @todo doc
   * @safe
   */
  off (...args) {
    return this._emitter.off(...args)
  }

  /**
   * @todo doc
   * @safe
   */
  once (...args) {
    return this._emitter.once(...args)
  }

  /**
   * build task tree
   * @throw error if task.wait ids does not exist
   */
  build () {
    this._log.trace({ ns: 'macalino', m: 'runner build' })
    this._log.debug('macalino', 'runner build', { queue: this._queue })
    this._tree = {
      root: []
    }
    for (let i = 0; i < this._queue.length; i++) {
      const id = this._queue[i]
      const _task = this._tasks[id]
      if (this._select === references.select.ONLY && !_task.only) {
        _task.skip = true
      }
      if (!_task.wait) {
        this._tree.root.push({ id, nodes: [] })
      } else {
        if (this._select !== references.select.NONE) {
          this._unskipWaiting(id)
        }
        for (let i = 0; i < _task.wait.length; i++) {
          const _wait = _task.wait[i]
          const node = tree.node(this._tree, _wait)
          if (!node) {
            throw new Error('Task wait not existing one: ' + _wait)
          }
          node.nodes.push({ id, nodes: [] })
        }
      }
    }
    this._log.debug('macalino', 'runner tree', this._tree)
  }

  /**
   * unskip waiting dependencies
   * NB does not need to be recursive, because tasks are added sequentially
   * @param {Id} id - task id
   */
  _unskipWaiting (id) {
    const _task = this._tasks[id]
    for (let i = 0; i < _task.wait.length; i++) {
      const _wait = _task.wait[i]
      delete this._tasks[_wait].skip
      /*
      not needed
      if (this._tasks[_wait].wait && !this._tasks[_wait]._unskipped) {
        this._unskipTree(_wait)
      }
      */
    }
    this._tasks[id]._unskipped = true
  }

  /**
   * @param {Id|Id[]} ids task ids to select
   * @param {Select} select selection mode: references.select.ONLY or references.select.SKIP
   */
  _selectTasks (ids, select) {
    this._select = select
    if (!Array.isArray(ids)) {
      ids = [ids]
    }
    const _act = select === references.select.ONLY ? 'only' : 'skip'
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i]
      this._tasks[id][_act] = true
    }
  }

  _updateTasksTimeout (timeout) {
    for (const id in this._tasks) {
      this._tasks[id].timeout = timeout
    }
  }

  /**
   * run all tasks
   * same as start, but wait for end
   * @todo on error
   * @param {Id|Id[]?} options.only run only these tasks; if both `skip` and `only` are passed, `only` will be considered
   * @param {Id|Id[]?} options.skip skip these tasks
   * @param {number?} options.timeout - update default timeout, @see add#option.timeout for details
   * @return {Result} when finish
   * @safe
   */
  run (options = {}) {
    return new Promise(resolve => {
      this._log.trace({ ns: 'macalino', m: 'runner run' })
      this._log.debug({ ns: 'macalino', m: '_run', options })
      validate.options(options)
      if (options.only) {
        this._selectTasks(options.only, references.select.ONLY)
      } else if (options.skip) {
        this._selectTasks(options.skip, references.select.SKIP)
      }
      if (options.timeout !== undefined) {
        this._updateTasksTimeout(options.timeout)
      }

      if (!this._tree) {
        this.build()
      }
      this._emitter.emit('run:start')
      this._state = references.state.RUNNING
      this._run().then(() => {
        this._log.trace({ ns: 'macalino', m: 'runner', state: this._state })
        if (this._state !== references.state.PAUSE) {
          this._state = references.state.DONE
        }
        const result = this.result()
        this._log.trace({ ns: 'macalino', m: '_run', state: this._state, result })
        resolve(result)
        this._emitter.emit('run:end', { result })
      })
      // no catch, _run is safe
    })
  }

  /**
   * @note run using a tree because using a queue require to push pending and checking tasks while running: that's heavy and slow
   * @note the tree is traversed breadth first
   * @safe
   */
  async _run () {
    if (this._settings.running === references.running.SERIES) {
      return this._runSeries()
    }
    return this._runParallel(this._tree.root)
  }

  /**
   * @safe
   */
  async _runSeries () {
    let todo = [this._tree.root]
    while (todo.length > 0 && this._state === references.state.RUNNING) {
      const next = []
      for (let i = 0; i < todo.length && this._state === references.state.RUNNING; i++) {
        for (let j = 0; j < todo[i].length && this._state === references.state.RUNNING; j++) {
          const _task = todo[i][j]
          try {
            await this._exec(_task.id)
          } catch (error) {
            // @todo if strategy == continue
            this._log.debug({ ns: 'macalino', f: '_runSeries', m: 'error in task ' + _task.id + ', continue' })
          }
          if (_task.nodes.length > 0) {
            next.push(_task.nodes)
          }
        }
      }
      todo = next
    }
  }

  /**
   * @safe
   */
  async _runParallel (tasks) {
    const _running = []
    for (let i = 0; i < tasks.length; i++) {
      const _task = tasks[i]
      this._log.debug({ ns: 'macalino', f: '_runParallel', m: 'run task', id: _task.id })
      _running.push((async () => {
        try {
          await this._exec(_task.id)
        } catch (error) {
          // @todo if strategy == continue
          this._log.debug({ ns: 'macalino', f: '_runParallel', m: 'error in task ' + _task.id + ', continue' })
        }
      })())
      if (_task.nodes.length > 0) {
        _running.push(this._runParallel(_task.nodes))
      }
    }
    await Promise.all(_running)
  }

  /**
   * @todo events
   * @todo chrono
   * @todo on error ...
   *
   * @param {Id} id - task id
   * wait for task end
   * @throw error is any in task
   */
  async _exec (id) {
    const _task = this._tasks[id]
    if (_task._running) {
      this._log.debug({ ns: 'macalino', f: '_exec', m: 'task ' + id + ' has already started' })
      return _task._running
    }

    _task._running = (async () => {
      if (_task.skip) {
        _task._skipped = true
        return
      }
      if (_task.wait) {
        for (let i = 0; i < _task.wait.length; i++) {
          const _wait = _task.wait[i]
          this._log.debug({ ns: 'macalino', f: '_exec', m: 'await for task ' + _wait })
          try {
            await this._tasks[_wait]._running
          } catch (error) {
            this._log.debug({ ns: 'macalino', f: '_exec', m: 'awaiting task ' + _wait + ' thrown error' })
            _task._error = new Error('ERROR_FROM_WAITING_TASK:' + _wait)
            throw _task._error
          }
        }
      }
      if (this._settings.trace) {
        _task._trace = { start: Date.now() }
      }
      this._emitter.emit('task:start', { id })

      this._log.debug({ ns: 'macalino', f: '_exec', m: 'after wait', state: this._state })
      if (this._state !== references.state.RUNNING) {
        // state was stopped or paused
        delete _task._running
        return
      }
      switch (_task.running) {
        case references.task.running.SINGLE:
          try {
            _task._output = await promise.timeout(_task.units, _task.timeout)
          } catch (error) {
            this._log.debug({ ns: 'macalino', f: '_exec', m: 'error in single', id })
            _task._error = error
          }
          this._log.debug({ ns: 'macalino', f: '_exec', m: 'single complete', id })
          break
        case references.task.running.SERIES:
          _task._output = []
          _task._output.length = _task.units.length
          for (let i = 0; i < _task.units.length; i++) {
            // @todo if strategy = continue
            try {
              _task._output[i] = await promise.timeout(_task.units[i], _task.timeout)
            } catch (error) {
              this._log.debug({ ns: 'macalino', f: '_exec', m: 'error in series', id, i })
              if (!_task._error) {
                _task._error = []
                _task._error.length = _task.units.length
              }
              _task._error[i] = error
            }
          }
          this._log.debug({ ns: 'macalino', f: '_exec', m: 'series complete', id })
          break
        case references.task.running.PARALLEL:
          // eslint-disable-next-line no-case-declarations
          const _jobs = []
          _task._output = []
          _task._output.length = _task.units.length
          for (let i = 0; i < _task.units.length; i++) {
            // @todo if strategy = continue
            _jobs.push((async () => {
              try {
                _task._output[i] = await promise.timeout(_task.units[i], _task.timeout)
              } catch (error) {
                this._log.debug({ ns: 'macalino', f: '_exec', m: 'error in parallel', id, i })
                if (!_task._error) {
                  _task._error = []
                  _task._error.length = _task.units.length
                }
                _task._error[i] = error
              }
            })())
          }
          await Promise.all(_jobs)
          this._log.debug({ ns: 'macalino', f: '_exec', m: 'parallel complete', id })
          break
      }
      if (this._settings.trace) {
        _task._trace.end = Date.now()
      }
      this._emitter.emit('task:end', { id, output: _task._output, error: _task._error })
      if (_task._error) {
        throw _task._error
      }
    })()
    return _task._running
  }

  /**
   * get result of last running
   * can be called during runnig to get the current state
   * @return {Result}
   * @safe
   */
  result () {
    const outputs = {}
    const errors = {}
    for (const i in this._tasks) {
      outputs[i] = this._tasks[i]._output
      if (this._tasks[i]._error) {
        errors[i] = this._tasks[i]._error
      }
    }
    return { outputs, errors }
  }

  /**
   * get result of last running
   * can be called during runnig to get the current state
   * @return {Trace}
   * @safe
   */
  trace () {
    if (!this._settings.trace) {
      return { error: 'trace was not enabled before start' }
    }
    const trace = {}
    for (const i in this._tasks) {
      trace[i] = this._tasks[i]._trace
      trace[i].duration = this._tasks[i]._trace.end - this._tasks[i]._trace.start
    }
    return trace
  }

  /**
   * clear tasks result and trace
   * @safe
   */
  _clear () {
    for (const i in this._tasks) {
      delete this._tasks[i]._trace
      delete this._tasks[i]._output
      delete this._tasks[i]._running
    }
  }

  /**
   * same as run but don't await for ending
   * @safe
   */
  start () {
    this.run()
  }

  /**
   * stop running, can't be resumed, can be restarted
   * can stop if state is paused
   * if running mode is SERIES stop immediately
   * if running mode is PARALLEL stop as soon as possible: started tasks will end
   *   stop can effectivly stop waiting tasks of current in execution
   * @return {Promise<boolean>} has stopped or not
   * @safe
   */
  stop () {
    return new Promise(resolve => {
      if (this._state !== references.state.RUNNING && this._state !== references.state.PAUSE) {
        this._log.warn({ ns: 'macalino', m: 'cant stop the runner, state is', state: this._state })
        return resolve(false)
      }
      this._emitter.once('run:end', () => resolve(true))
      this._state = references.state.STOP
    })
  }

  /**
   * restart the runner from any state
   * @safe
   */
  async restart () {
    await this.stop()
    this._clear()
    this.start()
  }

  /**
   * pause the runner, can be resumed, can be restarted
   * runner can't stop if is not running (stopped or ended)
   * @return {boolean} has paused or not
   * @safe
   */
  pause () {
    if (this._state !== references.state.RUNNING) {
      this._log.warn({ ns: 'macalino', m: 'cant pause the runner, state is', state: this._state })
      return false
    }
    this._state = references.state.PAUSE
    return true
  }

  /**
   * resume the runner from paused point
   * runner can't resume if is not paused (running, stopped or ended)
   * @return {boolean} has resumed or not
   * @safe
   */
  resume () {
    if (this._state !== references.state.PAUSE) {
      this._log.warn({ ns: 'macalino', m: 'cant resume the runner, state is', state: this._state })
      return false
    }
    this._state = references.state.RUNNING
    this.start()
    return true
  }

  /**
   * @safe
   */
  draw () {
    if (!this._tree) {
      this.build()
    }
    return draw.tree(this._tree, this._tasks)
  }
}

module.exports = Runner
