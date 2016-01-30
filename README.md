# spork

> Stress-free node child process spawning and management

----------

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

 - manage and kill processes that fail
 - capture and/or act on `stdio` events
 - capture and/or act on failures
 - show more output (`verbose`)
 - suppress all output (`quiet`)
 - retain ANSI color character sequences through the pipe
 - exit cleanly
 
## Installation

```bash
$ npm install --save node-spork
```
 
## The interface

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

## Options

All options [here](https://github.com/foreverjs/forever-monitor#options-available-when-using-forever-in-nodejs), plus:
- `quiet` _{boolean}_ - Suppress all output.
- `verbose` _{boolean}_ - Display additional output.
- `exit` _{boolean}_ - Close the child process on exit.
- `stdio` _{array}_ - Identify the file descriptors to use for `STDIN`, `STDOUT`, `STDERR`. Each value not provided
defaults to `inherit`, i.e. `['inherit', 'inherit', 'inherit']`. Possible values:
    - `inherit` - read/write stream data to/from the parent process
    
> You can completely nix the built-in `stdio` inheritence using `stdio: [null, null, null]` and manage it all yourself.

## Events

[Here](https://github.com/foreverjs/forever-monitor#events-available-when-using-an-instance-of-forever-in-nodejs)

## Contributing

This is a brand new project, but actively maintained. [pull requests](https://github.com/justinhelmer/node-spork/pulls) are encouraged.
