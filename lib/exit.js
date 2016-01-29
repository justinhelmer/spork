(function() {
  'use strict';

  var _ = require('lodash');
  var chalk = require('chalk');
  var pluralize = require('pluralize');

  function exit(children, options) {
    process.stdin.resume();

    process.on('exit', exitHandler);
    process.on('SIGINT', _.partial(exitHandler, {exitCode: 2}));
    process.on('uncaughtException', _.partial(exitHandler, {exitCode: 99}));

    function exitHandler(exitData, err) {
      if (err && err.stack) {
        console.error(chalk.red(err));
        process.exit(1);
      }

      if (_.get(children, 'length')) {
        if (options.verbose) {
          console.log('Killing ' + chalk.bold.blue(children.length + '') + ' background ' + pluralize('process', children.length) + '...');
        }

        _.invoke(children, 'kill');
        children = [];
      }

      if (_.get(exitData, 'exit')) {
        process.exit(exitData.exit);
      }
    }
  }

  module.exports = exit;
})();
