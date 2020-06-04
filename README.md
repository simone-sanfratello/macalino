# macalino

[![NPM Version](http://img.shields.io/npm/v/macalino.svg?style=flat)](https://www.npmjs.org/package/macalino)
[![NPM Downloads](https://img.shields.io/npm/dm/macalino.svg?style=flat)](https://www.npmjs.org/package/macalino)
[![JS Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/braceslab/macalino.svg?branch=master)](https://travis-ci.org/braceslab/macalino)
![100% code coverage](https://img.shields.io/badge/coverage-100%25-brightgreen)

JavaScript task runner full optional

## Purpose

As developer, I want to:

- run any kind of task (sync/async, Promises/callback) mixing parallel or serial
- run tasks with dependencies tree
- listen to tasks events (`start`, `stop`)
- have task options like `only`, `skip`, `timeout`
- start/stop/pause/resume/restart the batch
- do all above easily

Inspired by [orchestrator](https://github.com/robrich/orchestrator), [undertaker](https://github.com/gulpjs/undertaker) and [jest](https://jestjs.io)

## Installing

````bash
npm i macalino
````

## Quick start

minimal example

```js
const m = require('macalino')

const run = async function () {
  const runner = new m.Runner()

  runner.add('task#1', async () => { await deelay(200); return 'task 1 done' })
  runner.add('task#1.1', async () => { await deelay(100); return 'task 1.1 done' })

  runner.add('task#2', async () => { await deelay(50); return 'task 2 done' })

  runner.add('task#3', async () => { await deelay(50); return 'task 3 done' }, { wait: ['task#1', 'task#2'] })

  const result = await runner.run()

  console.log(result)
}

run()
```

(@todo output)

full optional example

@todo

## Features

@todo

- task
  - [x] single
  - [x] series
  - [x] parallel
  - [x] `wait` option
    - [x] `wait` for multiple tasks
    - note: circularity is prevented because task can wait only for already existing tasks - it's a tree
  - `Promise` interface
    - [X] wrapper for callback and events: `macalino.promise.event`, `macalino.promise.callback`
    - [x] collect results > `results = await runner.run()`
- settings
  - [x] settings.running : `SERIES` | `PARALLEL` (default `PARALLEL`)
  - [x] settings.trace > track time (default false)
- events on run
  - [x] `on`, `once`, `off`
  - [x] `run:start`
  - [x] `run:end({result: {outputs, errors}})`
  - [x] `task:start({id})`
  - [x] `task:end({id, output, error?})`
- play
  - [x] start
  - [x] stop
  - [x] restart
  - [x] pause
  - [x] resume
- `skip` option
  - [x] in `.add`
  - [x] override in `.run` options
- `only` option
  - [x] in `.add`
  - [x] override in `.run` options
- error
  - default behavior: continue
- `timeout`
  - timeout for each task execution
  - [x] in `.add`
  - [x] override in `.run` options
- log
  - [x] each instance of Runner has its own log settings
- [x] draw tree in console
- [x] test coverage 100%

### Logging

`macalino` use `peppino` as logger, see [peppino doc](https://github.com/simone-sanfratello/peppino)

## API

@todo
(jsdoc + examples)

---

### TODO

- [ ] jsdoc
- [ ] standard-release, conventional-commit

### NEXT

- [ ] strategy on error: continue, stop/pause after N errors
- [ ] execution limit: running concurrent tasks
- [ ] test with 1k tasks, 10k, 100k >>> get stack overflow error
- [ ] benchmarks
- [ ] experiment: `workers` as classic thread
  - notes https://www.codewall.co.uk/how-to-implement-worker-threads-in-node-js/
- [ ] visual run (http)

---

## License

The MIT License (MIT)

Copyright (c) 2020 Simone Sanfratello

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
