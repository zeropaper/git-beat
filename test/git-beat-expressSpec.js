'use strict';
var expect = require('expect.js');
var path = require('path');
// var fs = require('fs-extra');
var tmp = require('tmp');
var request = require('supertest');
var express = require('express');

var app = express();

var projectPath = path.resolve(__dirname, './..');
var pkg = require(projectPath + '/package.json');

var repos = {};


// gitBeat.clone({
//   dest: 'git-beat',
//   // url: 'file://' + path.resolve(__dirname, '..') + '/.git'
//   url: pkg.repository.url

tmp.setGracefulCleanup();





describe('git-beat express middleware', function () {
  var tmpDirPath;
  var gitBeat;
  var GitBeat;
  var gitBeatExpress;
  var middleware;

  before(function (done) {
    tmp.dir(function (err, createdPath) {
      if (err) {
        return done(err);
      }
      tmpDirPath = createdPath;

      repos = {
        'git-beat-testing': {
          cwd: tmpDirPath,
          url: pkg.repository.url,
          branch: 'testing'
        }
      };

      GitBeat = require(projectPath + '/lib/git-beat');

      gitBeat = new GitBeat({
        cwd: tmpDirPath
      });

      done();
    });
  });


  it('initializes', function () {
    expect(function () {
      gitBeatExpress = require(projectPath + '/lib/git-beat-express');
    }).not.to.throwError(function (err) {
      console.info('loading error', err.stack);
    });

    expect(function () {
      middleware = gitBeatExpress({});
    }).to.throwError();

    expect(function () {
      middleware = gitBeatExpress({
        app: app,
        repos: repos
      });
    }).not.to.throwError(function (err) {
      console.info('initialization error', err.stack);
    });

    expect(function () {
      app.use(middleware);
    }).not.to.throwError(function (err) {
      console.info('use as middleware error', err.stack);
    });

    expect(function () {
      app.use('/path-prefixed', gitBeatExpress({
        app: app,
        pathPrefix: '/path-prefixed',
        repos: repos,

      }));
    }).not.to.throwError(function (err) {
      console.info('use as middleware error', err.stack);
    });
  });


  xdescribe('routes', function () {
    it('serves without prefix', function (done) {
      request(app)
        .get('/git-beat-testing')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res).to.be.an('object');
          expect(res.url).to.be.a('string');
          done();
        });
    });



    it('serves with prefix', function (done) {
      request(app)
        .get('/path-prefixed/git-beat-testing')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res).to.be.an('object');
          expect(res.url).to.be.a('string');
          done();
        });
    });



    it('serves with prefix', function (done) {
      request(app)
        .get('/path-prefixed/git-beat-testing')
        .expect('Content-Type', /json/)
        .expect(200)
        .end(function (err, res) {
          expect(err).to.eql(null);
          expect(res).to.be.an('object');
          expect(res.url).to.be.a('string');
          done();
        });
    });
  });
});
