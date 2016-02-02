(function() {
  'use strict';

  var _ = require('lodash');
  var chalk = require('chalk');
  var forever = require('forever-monitor');

  var STDIN = 0;
  var STDOUT = 1;
  var STDERR = 2;

  var exitOptions = {children: []};

  /**
   * Fork a child process using child_process.spawn. Follows a very similar syntax:
   *
   *     spawn('command.sh', ['--arg'], options}
   *     fork('command.sh', ['--arg'], options}
   *
   * However, it adds sugar options, cleans up after itself, etc.
   *
   * @param {string} command - The command to run.
   * @param {mixed} [args] - The arguments to pass to the command, as an {array}. Also can pass {object} [options] in this position and ignore [args].
   * @param {object} [options] - Additional options to be passed to forever-monitor, plus custom options.
   * @param {mixed} [options.exit='failure'] - Close the child process on exit.
   *                                           Can be `success`, `failure`, `always`, `false`, or `true` (alias for `always`).
   * @param {boolean} [options.quiet=false] - Output nothing (suppress STDOUT and STDERR)').
   * @param {array} [options.stido=['inherit', 'inherit', 'inherit']] - Identify whether or not to pipe STDIN, STDOUT, STDERR to the parent process.
   * @param {mixed} [options.verbose=false] - Output more. Can be a boolean or a number. The higher the number, the higher the verbosity.
   * @returns {forever.Monitor}
   * @see https://nodejs.org/api/child_process.html#child_process_child_process_spawn_command_args_options
   * @see https://github.com/foreverjs/forever-monitor
   */
  function spork(command, args, options) {
    if (_.isPlainObject(args)) {
      // in the format: spork(command, options)
      options = args;
      args = null;
    }

    args = _.union([command], args || []);
    options = options || {};
    exitOptions.quiet = false;
    exitOptions.verbose = false;

    if (options.verbose) {
      console.log(chalk.bold.green('Launching child process:') + '\n\n    ' + chalk.white(args.join(' ')) + '\n');
      exitOptions.verbose = options.verbose;
      options.quiet = false;
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

    if (options.exit !== false) {
      child.on('exit:code', function(code) {
        if (_.isFinite(options.verbose) && options.verbose > 1) {
          console.log(chalk.magenta('Exiting'), chalk.blue(command), 'with code', code);
        }

        if (code === 0 && _.includes([true, 'always', 'success'], options.exit)) {
          process.exit();
        } else if (code !== 0 && (!options.exit || _.includes([true, 'always', 'failure'], options.exit))) {
          process.exit(code);
        }
      });
    }

    child.start();

    exitOptions.children.push(child);
    return child;
  }

  require('node-clean-exit')(exitOptions);

  module.exports = spork;
})();
