(function() {
  'use strict';

  var _ = require('lodash');
  var chalk = require('chalk');
  var forever = require('forever-monitor');

  var STDIN = 0;
  var STDOUT = 1;
  var STDERR = 2;

  var children = [];
  var exitOptions = {};

  /**
   * Fork a child process using child_process.spawn. Follows a very similar syntax:
   *
   *     spawn('command.sh', ['--arg'], options}
   *     fork('command.sh', ['--arg'], options}
   *
   * However, it adds sugar options, cleans up after itself, etc.
   *
   * @param {string} command - The command to run.
   * @param {array} args - The arguments to pass to the command.
   * @param {object} options - Additional options to be passed to Forever.monitor(), plus additional custom options:
   *                              - quiet - Suppress all output.
   *                              - verbose - Display additional output.
   *                              - exit - Close the child process on exit.
   *                              - stido - Identify the file descriptors to use for STDIN, STDOUT, STDERR"
   *                                  - 'inherit' - read/write stream data to/from the parent process
   * @returns {forever.Monitor}
   * @see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
   * @see https://github.com/foreverjs/forever-monitor
   */
  function spork(command, args, options) {
    args = _.union([command], args || []);
    options = options || {};
    exitOptions.quiet = false;
    exitOptions.verbose = false;

    if (options.verbose) {
      console.log(chalk.bold.green('Launching child process:') + '\n\n    ' + chalk.white(args.join(' ')) + '\n');
      exitOptions.verbose = true;
    } else if (options.quiet) {
      exitOptions.quiet = true;
    }

    var customOptions = ['exit', 'quiet', 'stdio', 'verbose'];
    var child = new (forever.Monitor)(args, _.extend({
      max: 1,
      silent: true,
      watch: false
    }, _.omit(options, customOptions)));

    if (!options.quiet) {
      var stdio = _.isArray(options.stdio) ? options.stdio : ['inherit', 'inherit', 'inherit'];

      if (stdio[STDIN] === 'inherit') {
        child.on('stdin', function(data) {
          process.stdin.write(data);
        });
      }

      if (stdio[STDOUT] === 'inherit') {
        child.on('stdout', function(data) {
          process.stdout.write(data.toString('utf8'));
        });
      }

      if (stdio[STDERR] === 'inherit') {
        child.on('stderr', function(data) {
          process.stderr.write(data.toString('utf8'));
        });
      }
    }

    if (_.get(options, 'exit')) {
      child.on('exit:code', _.ary(process.exit, 1));
    }

    child.on('error:code', _.ary(process.exit, 1));
    child.start();

    children.push(child);
    return child;
  }

  require('../lib/exit')(children, exitOptions);

  module.exports = spork;
})();
