# spork

> Stress-free node child process spawning and management

----------

Not everything has a `node` adapter. Often times, there is a need to spawn a child process to run another script (maybe even fork another `node` process).

Forking and managing child processes in `node` can be a pain. If something fails in the pipe, you can be left over with `phantom processes` running in the background.
Over time, these can accumulate and result in strange issues such as blocked ports, misbehaving debug tools, "random" exits, etc.

Even a number of popular `node` modules, `grunt` plugins, etc. fail to exit cleanly.

## Overview

`Spork` follows a very similar syntax to `node` core's [child_process.spawn](https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options)
to keep the interface simple. It also takes advantage of the power of [forever-monitor](https://github.com/foreverjs/forever-monitor) to add some much-needed
robustness to the interface. The syntax should be straight-forward and familiar:

```js
spork(command, args, options);
```
```

Besides spawning child processes, `spork` can do a few other things:

 - manage and kill processes that fail
 - capture/act on `stido` events
 - show more output (`verbose`)
 - suppress all output (`quiet`)
 - retain ANSI color character sequences through the pipe
 - exit cleanly
 
## Installation

```bash
$ npm install --save node-spork
```
 
## The interface

Instead of doing this:

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

Do this:

```js
spork('command', ['--arg1', '--arg2'], {env: {WHATEVER: 'isNeeded'}})
    .on('stdout', function(data) {
      // ... do something ...
    })
    .on('exit', function(code) {
      // ... do something ...
      process.exit(code);
    });
```

Or, let `spork` handle everything:

```js
spork('command', ['--arg1', '--arg2'], {exit: true});
```

## Options

- All options [here](https://github.com/foreverjs/forever-monitor#options-available-when-using-forever-in-nodejs)
- `quiet` {boolean} - Suppress all output.
- `verbose` {boolean} - Display additional output.
- `exit` {boolean} - Close the child process on exit.
- `stido` {array} - Identify the file descriptors to use for STDIN, STDOUT, STDERR. Default value: ['inherit', 'inherit', 'inherit']
    - 'inherit' - read/write stream data to/from the parent process
    
> You can completely nix the built-in `stdio` inheritence using `stido: [null, null, null]`

## Events

[Here](https://github.com/foreverjs/forever-monitor#events-available-when-using-an-instance-of-forever-in-nodejs)

## Contributing

This is a brand new project, but actively maintained. `Pull requests` are encouraged.
