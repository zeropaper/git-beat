'use strict';
/* jshint node: true */
var command = module.exports = {};
var utils = require('./../git-beat-utils');
var trim = utils.trim;

command.cmd = function (splitter, options) {
  options = options || {};
  splitter = '---' + splitter + '---';
  var optionsStr = '';

  if (options.number) {
    optionsStr += ' -n ' + options.number;
  }

  if (options.search) {
    optionsStr += ' --grep="' + options.search + '"';
  }

  [
    'max-count',
    'skip',
    'after',
    'before',
    'commiter',
    'grep'
  ].forEach(function (option) {
    if (options[option]) {
      optionsStr += ' --' + option + '="' + options[option] + '"';
    }
  });

  var cmd = 'git log --stat' + optionsStr + ' --pretty=format:"' + ([
    '%H%n',
    'abbreviatedHash',  '%h',
    'authorDate',       '%ai',
    'authorName',       '%an',
    'committerDate',    '%ci',
    'committerName',    '%cn',
    'commitNotes',      '%N',
    'subject',          '%s',
    'body',             '%b',
    'stat',             ''
  ].join(splitter)) + '"';

  return cmd;
};

command.parser = function (splitter, options) {
  options = options || {};
  var infoExp = new RegExp('---' + splitter + '---', 'mg');
  var commitExp = /([a-z0-9]{40})\n/gm;

  var conventionalExp = /^([a-z0-9_-]+)\s*\(([a-z0-9_-\s]+)\):(.+)$/i;

  return function (result, done) {
    var parts = (result || '').split(commitExp);
    parts.shift();

    var commits = utils.zipArray(parts);
    var results = [];

    for (var hash in commits) {
      var info = commits[hash].split(infoExp);
      info.shift();
      var commit = utils.zipArray(info);
      commit.hash = hash;
      commit.body = trim(commit.body);

      var stat = trim(commit.stat).split('\n');
      commit.summary = trim(stat.pop());

      commit.stat = {};
      for (var s in stat) {
        var lineParts = stat[s].split(' | ');
        if (lineParts.length === 2) {
          commit.stat[trim(lineParts[0])] = trim(lineParts[1]);
        }
      }

      commit.conventional = commit.subject.match(conventionalExp);
      if (commit.conventional) {
        commit.conventional = {
          type: trim(commit.conventional[1]),
          scope: trim(commit.conventional[2]),
          subject: trim(commit.conventional[3])
        };
      }

      results.push(commit);
    }

    done(null, utils.sortCommits(results, options.sortBy));
  };
};
