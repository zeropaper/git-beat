'use strict';
var expect = require('expect.js');
var path = require('path');
var fs = require('fs-extra');
var tmp = require('tmp');

var projectPath = path.resolve(__dirname, './..');
var pkg = require(projectPath + '/package.json');


tmp.setGracefulCleanup();


function searchTest(gb, search, done) {
  gb.log({
    search: search
  }, function (err, result) {
    expect(err).to.eql(null);
    expect(result).to.be.an('object');

    done(null, result);
  });
}


describe('git-beat', function () {
  var tmpDirPath;

  before(function (done) {
    tmp.dir(function (err, createdPath) {
      if (err) {
        return done(err);
      }
      tmpDirPath = createdPath;

      done();
    });
  });


  var gitBeat;
  var GitBeat;
  describe('constructor', function () {
    it('intanciates', function () {
      expect(function () {
        GitBeat = require(projectPath + '/lib/git-beat');
      }).not.to.throwError(function (err) {
        console.info('loading error', err.stack);
      });


      expect(function () {
        gitBeat = new GitBeat({
          // logger: function () { console.info('TEST:', arguments); },
          cwd: tmpDirPath
        });
      }).not.to.throwError();

      expect(gitBeat.cwd).to.be(tmpDirPath);
    });
  });


  describe('clone()', function () {
    it('clones a repository', function (done) {
      expect(gitBeat.clone).to.be.a('function');

      gitBeat.clone({
        dest: 'git-beat',
        // url: 'file://' + path.resolve(__dirname, '..') + '/.git'
        url: pkg.repository.url
      }, function (err) {
        expect(err).to.eql(null);
        expect(gitBeat.cwd).to.be(tmpDirPath + '/git-beat/');
        done();
      });
    });
  });




  describe('checkout()', function () {
    it('cannot switch to unexisting branch', function (done) {
      gitBeat.checkout('does-not-exists', function (err) {
        expect(err).not.to.eql(null);

        done();
      });
    });


    it('switches between branches', function (done) {
      gitBeat.checkout('testing', function (err, result) {
        expect(err).to.eql(null);
        // expect(result).to.be.an('object');

        // ...
        done();
      });
    });
  });


  describe('log()', function () {
    var log;

    it('get the log', function (done) {
      expect(gitBeat.log).to.be.a('function');

      gitBeat.log(function (err, result) {
        expect(err).to.eql(null);
        expect(result).to.be.an('object');
        expect(Object.keys(result).length).not.to.be(0);
        log = result;
        done();
      });
    });



    describe('result array', function () {
      var commit;

      before(function (done) {
        commit = log[2];
        // console.info('commit', JSON.stringify(commit, null, 2));
        done();
      });

      it('has formatted information', function () {
        expect(commit).to.be.an('object');

        expect(commit).to.have.keys([
          'hash',
          'abbreviatedHash',
          'authorDate',
          'authorName',
          'committerDate',
          'committerName',
          'commitNotes',
          'subject',
          'body',
          'summary',
          'stat'
        ]);

        expect(commit.subject).to.be('impr(file): add a second file');

        expect(commit.body).not.to.be('\n');

        expect(commit.stat).to.be.an('object');
      });

      it('parses the conventional commit subjects', function () {
        expect(commit.conventional).to.be.an('object');

        expect(commit.conventional).to.have.keys([
          'type',
          'scope',
          'subject'
        ]);

        expect(commit.conventional.type).to.be('impr');

        expect(commit.conventional.scope).to.be('file');

        expect(commit.conventional.subject).to.be('add a second file');
      });


      it('is sorted by committerDate', function () {
        expect(log[0].hash).to.be('e6f9476cc980a9cec548eb0f28fede63a2d2ed57');

        expect(log[3].hash).to.be('1ee2f06a77539542be1bda4ee4891cf899ece238');
      });
    });



    describe('search', function () {
      it('search commits with a string', function (done) {
        searchTest(gitBeat, 'impr(text): add a line', function (err, result) {
          var commit = result[0];

          expect(result.length).to.be(1);

          expect(commit.subject).to.be('impr(text): add a line');


          searchTest(gitBeat, 'add a second', function (err, result) {
            expect(result.length).to.be(2);

            searchTest(gitBeat, 'for testing purposes', function (err, result) {
              expect(result.length).to.be(2);

              done();
            });
          });
        });
      });
    });
  });






  describe('branch()', function () {
    var newBranchName = 'new-branch' + Math.round(Math.random() * 1000);

    it('get the list of branches', function (done) {
      gitBeat.branch(function (err, result) {
        expect(err).to.eql(null);
        expect(result).to.be.an('object');

        expect(result.testing).to.be(true);
        expect(result['remotes/origin/HEAD -> origin/master']).to.be(false);

        done();
      });
    });


    it('creates new branches', function (done) {
      gitBeat.branch({
        create: newBranchName
      }, function (err) {
        expect(err).to.eql(null);

        gitBeat.branch(function (err, result) {
          expect(err).to.eql(null);

          expect(result).to.be.an('object');

          expect(result[newBranchName]).to.be(true);
          done();
        });
      });
    });


    xit('drops (delete) branches', function (done) {
      gitBeat.branch({
        drop: newBranchName
      }, done);
    });
  });





  describe('status()', function () {
    var status;

    before(function (done) {
      fs.writeFile(gitBeat.cwd + '/new-file.txt', 'content', function (err) {
        if (err) {
          return done(err);
        }

        fs.readFile(gitBeat.cwd + '/existing.md', function (err, content) {
          if (err) {
            return done(err);
          }

          fs.writeFile(gitBeat.cwd + '/existing.md', content + '\nnew line', function (err) {
            if (err) {
              return done(err);
            }

            done();
          });
        });
      });
    });


    it('collect status information', function (done) {
      gitBeat.status(function (err, result) {
        expect(err).to.eql(null);
        expect(result).to.be.an('object');
        status = result;
        done();
      });
    });


    it('handles new files', function () {
      var newFile = status['new-file.txt'];

      expect(newFile).to.be.an('object');
      expect(newFile.remote).to.be('untracked');
      expect(newFile.local).to.be('untracked');
    });


    it('handles modified files', function () {
      var changedFile = status['existing.md'];

      expect(changedFile).to.be.an('object');
      expect(changedFile.remote).to.be('unmodified');
      expect(changedFile.local).to.be('modified');
    });
  });
});
