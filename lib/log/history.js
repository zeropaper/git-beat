'use strict';
/* jshint node: true */
var command = module.exports = {};
var utils = require('./../git-beat-utils');

command.cmd = function (splitter) {
  splitter = '---' + splitter + '---';
  return 'git log --pretty=format:"' + ([
    '%H%n',
    'abbreviatedHash',  '%h',
    'authorDate',       '%ai',
    'authorName',       '%an',
    'committerDate',    '%ci',
    'committerName',    '%cn',
    'commitNotes',      '%N',
    'subject',          '%s',
    'body',             '%b'
  ].join(splitter)) + '"';
};

command.parser = function (splitter) {
  var infoExp = new RegExp('---' + splitter + '---', 'mg');
  var commitExp = /([a-z0-9]{40})\n/gm;

  return function (result, done) {
    var parts = (result || '').split(commitExp);
    parts.shift();

    var commits = utils.zipArray(parts);

    for (var hash in commits) {
      var info = commits[hash].split(infoExp);
      info.shift();
      commits[hash] = utils.zipArray(info);

      commits[hash].body = commits[hash].body === '\n' ? '' : commits[hash].body;
    }

    done(null, commits);
  };
};
