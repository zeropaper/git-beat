'use strict';
/* jshint node: true, unused: false */
var exec = require('child_process').exec;
var spawn = require('child_process').spawn;
var path = require('path');

function noop() {}

function thr(err, cb) {
  if (typeof cb === 'function') {
    return cb(err);
  }
  throw err;
}


/**
 * GitBeat is aimed to take the pulse of Git repositories.
 * @param {Object|String} options     is either an object or the URL of a repository
 * @param {String} [options.cwd]      to set the working directory path
 * @param {Function} [options.logger] a function to log
 */
function GitBeat(options) {
  var self = this;
  var url;

  options = options || {};

  if (typeof options === 'string') {
    url = options;
    options = {};
  }


  this.cwd = path.resolve(options.cwd || '');
  this.logger = options.logger || noop;

  url = url || options.url;
  this.isCloned = false;
  if (url) {
    this.logger('initial clone', url, !!options.done);
    this.clone(url, options.done || noop);
  }
}


GitBeat.prototype.exec = function (cmd, done) {
  var log = this.logger;
  var cwd = this.cwd;
  var traceError = new Error('exec in "' + cwd + '" ' + cmd);

  exec(cmd, {
    cwd: this.cwd
  }, function (err, stdout, stderr) {
    if (err) {
      traceError.message += ', \n' + err.message;
      return done(traceError, stdout, stderr);
    }
    done(null, stdout, stderr);
  });
};


GitBeat.prototype.read = function (cmd, parser, done) {
  var self = this;
  exec(cmd, {
    cwd: this.cwd
  }, function (err, stdout, stderr) {
    if (err) {
      self.logger(err.stack);
      return done(err);
    }

    parser(stdout, done);
  });
};



GitBeat.prototype.log = function () {
  var done = arguments[arguments.length - 1];

  if (typeof done !== 'function') {
    throw new Error('Missing callback for log()');
  }

  var options = {};
  var wanted = 'history';

  switch (arguments.length) {
    case 2:
      options = arguments[0];
      wanted = options.wanted || wanted;
      break;
  }

  var splitter = 'K3yB0ardC4t' + Math.round(Math.random() * 1000000);

  var method;
  try {
    method = require('./log/' + wanted);
  }
  catch (err) {
    return done(err);
  }

  var parserOptions = {
    sortBy: options.sortBy
  };

  this.read(method.cmd(splitter, options), method.parser(splitter, parserOptions), function (err, results) {
    if (err) { return done(err); }

    done(err, results.map(function (result) {
      result.committerDate = new Date(result.committerDate);
      result.authorDate = new Date(result.authorDate);
      return result;
    }));
  });
};



GitBeat.prototype.status = function (options) {
  var done = arguments[arguments.length - 1];

  if (typeof done !== 'function') {
    throw new Error('Missing callback for log()');
  }

  var labels = {
    M:    'modified',
    A:    'added',
    D:    'deleted',
    R:    'renamed',
    C:    'copied',
    U:    'unmerged',
    ' ':  'unmodified',
    '?':  'untracked'
  };



  this.read('git status --porcelain', function (result, cb) {
    var obj = {};
    var lines = result.split('\n');
    for (var l in lines) {
      var line = lines[l];
      var filepath = line.slice(3, line.length);
      if (filepath) {
        obj[filepath] = {
          remote: labels[line[0]] || 'error',
          local: labels[line[1]] || 'error'
        };
      }
    }

    cb(null, obj);
  }, done);
};


GitBeat.prototype.fetch = function (options) {
  var done = arguments[arguments.length - 1];

  if (typeof done !== 'function') {
    throw new Error('Missing callback for log()');
  }

  this.read('git fetch', function (result, cb) { cb(); }, done);
};



GitBeat.prototype.branch = function (options) {
  var done = arguments[arguments.length - 1];
  var self = this;

  if (typeof done !== 'function') {
    throw new Error('Missing callback for log()');
  }

  if (options.create) {
    return this.checkout({
      newBranch: options.create
    }, done);
  }


  self.read('git branch --list --all', function (result, cb) {
    var obj = {};
    var lines = result.split('\n');

    for (var l in lines) {
      var line = lines[l];
      var current = line[0] === '*';
      var name = line.slice(2);

      if (current && options.current) {
        return cb(null, name);
      }

      if (name) {
        obj[name] = current;
      }
    }

    cb(null, obj);
  }, done);

  // this.fetch(function (err) {
  //   if (err) {
  //     self.logger(err.stack);
  //     return done(err);
  //   }
  // });
};



GitBeat.prototype.checkout = function (options) {
  var done = arguments[arguments.length - 1];
  var branch;

  if (typeof done !== 'function') {
    throw new Error('Missing callback for log()');
  }

  options = options || {};

  if (options.newBranch) {
    return this.exec('git checkout -b ' +  options.newBranch, done);
  }

  if (typeof options === 'string') {
    branch = options;
    options = {};
  }
  else {
    branch = options.branch;
  }

  if (!branch) {
    return done(new Error('Missing branch name for branch()'));
  }

  this.exec('git checkout ' +  branch, done);
};



GitBeat.prototype.clone = function (options) {
  var done = arguments[arguments.length - 1];
  var self = this;
  var url = this.url || false;
  var dest;
  var cmd;

  options = options || {};

  if (typeof options === 'string') {
    url = options;
    options = {};
  }

  url = url || options.url;

  if (!url) {
    return done(new Error('Could not determine the url of repository'));
  }

  this.url = url;

  dest = options.dest || path.basename(url, '.git');
  dest = dest || path.basename(path.dirname(url));
  cmd = 'git clone ' + url + ' ' + dest;

  this.exec(cmd, function (err) {
    if (err) {
      self.logger(err.stack);
      return done(err);
    }

    if (!options.keepCwd) {
      self.logger('move cwd to cloned repository ' + dest);
      self.cwd = self.cwd + '/' + dest + '/';
    }

    self.isCloned = true;
    done(null, arguments[1]);
  });
};



GitBeat.logger = function () {
  console.info('GitBeat:\t', [[arguments]]);
};

module.exports = GitBeat;
