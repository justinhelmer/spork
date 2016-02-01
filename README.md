# spork
Stress-free node child process spawning and management. A small wrapper around [forever-monitor](https://github.com/foreverjs/forever-monitor)
with a simple interface.

[![npm package](https://badge.fury.io/js/node-spork.svg)](https://www.npmjs.com/package/node-spork)
[![node version](https://img.shields.io/node/v/node-spork.svg?style=flat)](http://nodejs.org/download/)
[![dependency status](https://david-dm.org/justinhelmer/node-spork.svg)](https://github.com/justinhelmer/node-spork)
[![devDependency status](https://david-dm.org/justinhelmer/node-spork/dev-status.svg)](https://github.com/justinhelmer/node-spork#info=devDependencies)
[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/justinhelmer/node-spork/issues)

Not everything has a `node` adapter. Often times, there is a need to spawn a child process to run another script (maybe even fork another `node` process).

Forking and managing [child processes](https://nodejs.org/api/child_process.html) in `node` can prove challenging. If something fails in the pipe, you can be
left over with `phantom processes` running in the background. Over time, these can accumulate and result in strange issues such as blocked ports,
misbehaving debug tools, "random" exits, etc. Even a number of popular `node` modules, `grunt` plugins, etc. fail to exit cleanly. 

Additionally, the [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options) interface is
not very desirable. It was written for flexibility, but the majority of the time it is used the same way. Managing all of this correctly across multiple
processes and multiple scripts can be cumbersome and error-prone.

To defer this redudancy and avoid the risk, `spork` was created to try to make spawning and forking smoother -- hence the name.

## Overview

`Spork` follows a very similar syntax to `node` core's [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
to keep the interface simple. It also takes advantage of the power of [forever-monitor](https://github.com/foreverjs/forever-monitor) to add some much-needed
robustness to the interface. The syntax should be straight-forward and familiar:

```js
const spork = require('node-spork');
spork(command, args, options);
```

Besides spawning child processes, `spork` can do a few other things:

 - manage and kill processes that fail - clean exits using [node-clean-exit](https://github.com/justinhelmer/node-clean-exit)
 - capture and/or act on `stdio` events
 - exit automatically on `failure` and/or `success` (configurable)
 - show more output (`verbose`)
 - suppress all output (`quiet`)
 - retain `ANSI` color character sequences through the pipe
 
## Installation

```bash
$ npm install --save node-spork
```
 
## The interface

[Take me straight to the API](#spawncommand-argsoptions-options)

In its simplest form:

```js
spork('command', {exit: true}); // process will automatically exit when the command FAILS or SUCCEEDs
```

Normally, _all_ of this is required for just **one** process, in order to spawn it, act on data events, and exit cleanly:

```js
const done = async();

let child = spawn('command', ['--arg1', '--arg2'], {
  env: _.extend(process.env, {
    WHATEVER: 'isNeeded'
  }),

  stdio: [process.stdin, 'pipe', 'pipe']
});

child.stdout.setEncoding('utf8');
child.stderr.setEncoding('utf8');

child.stdout.on('data', function(data) {
  // .. do something
  
  process.stdout.write(data);
});

let errorBuffer = '';
child.stderr.on('data', function(data) {
  errorBuffer += data;
});

child.on('close', function(code) {
  if (code) {
    customErrorHandler(errorBuffer, code);
  } else {
    done();
  }
});

child.on('error', function(err) {
  console.error(err);
  process.exit(99);
});

process.stdin.resume();

process.on('exit', exitHandler);
process.on('SIGINT', _.partial(exitHandler, {exitCode: 2}));
process.on('uncaughtException', _.partial(exitHandler, {exitCode: 99}));

function exitHandler(exitData, err) {
  if (err && err.stack) {
    console.error(err);
    process.exit(1);
  }
  
  child.kill();

  if (exitData && exitData.exit) {
    process.exit(exitData.exit);
  }
}
```

Instead, just do this, to produce the same result:

```js
spork('command', ['--arg1', '--arg2'], {env: {WHATEVER: 'isNeeded'}})
    .on('stdout', function(data) {
      // .. do something
    })
    .on('exit', function(code) {
      // .. do something
      process.exit(code);
    });
```

Or, let `spork` handle everything:

```js
spork('command', ['--arg1', '--arg2'], {exit: true});
```

## spawn(command, [args|options], [options])

- @param **command** _{string}_ - The command to run.
- @param **[args]** _{mixed}_ - The arguments to pass to the command, as an _{array}_. Also can pass _{object}_ **[options]**
                                in this position and ignore **[args]**.
- @param **[options]** _{object}_ - Additional options to be passed to
                                    [forever-monitor](https://github.com/foreverjs/forever-monitor#options-available-when-using-forever-in-nodejs),
                                    plus custom options [below](#options).
- @returns _{[forever.monitor](https://github.com/foreverjs/forever-monitor)}_
- @see [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
- @see [forever-monitor](https://github.com/foreverjs/forever-monitor)

## Options

All options [here](https://github.com/foreverjs/forever-monitor#options-available-when-using-forever-in-nodejs), plus:
- **exit** _{mixed}_ - Close the child process on exit. Can be `success`, `failure`, `always`, or `true` (alias for `always`). Defaults to `failure`.
- **quiet** _{boolean}_ - Output nothing (suppress STDOUT and STDERR)'). Defaults to `false`.
- **stdio** _{array}_ - Identify whether or not to pipe STDIN, STDOUT, STDERR to the parent process. Defaults to `['inherit', 'inherit', 'inherit']`.
- **verbose** _{mixed}_ - Output more. Can be a boolean or a number. The higher the number, the higher the verbosity. Defaults to `false`.
    
> You can completely nix the built-in `stdio` inheritence using `stdio: [null, null, null]` and manage it all yourself.

## Events

[Here](https://github.com/foreverjs/forever-monitor#events-available-when-using-an-instance-of-forever-in-nodejs)

## Contributing

[![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/justinhelmer/node-spork/issues)
[![devDependency status](https://david-dm.org/justinhelmer/node-spork/dev-status.svg)](https://github.com/justinhelmer/node-spork#info=devDependencies)

## Licence

The MIT License (MIT)

Copyright (c) 2016 Justin Helmer

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
