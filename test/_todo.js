'use strict'


r = new macalino.Runner({
  limit: 2 // default is 0 = no limit
})

// concurrent runs

// start

// stop

// pause

// resume

// restart

// events:

// on start

// on stop/pause/resume/restart

// on task start

// on task stop

// on task error

// dependencies

// circularity

// only, skip, bail ...

// draw tree


  /*
  @todo
  test('restart', async () => {
    const runner = new macalino.Runner()
    let _runs = []
    const _result = []
    for (let i = 0; i < 10; i++) {
      runner.add('task#' + i, function () { _runs.push(i) })
      _result.push(i)
    }

    await runner.run()
    expect(_runs).toEqual(_result)

    _runs = []
    await runner.restart()
    expect(_runs).toEqual(_result)
  })
  */