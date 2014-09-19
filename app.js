'use strict';
/* jshint node: true */


var logger = require('nlogger').logger(module);
var express = require('express');
var _ = require('underscore');
var config = require('./config');
var poller = require('./poller');

var app = module.exports = express.createServer();
var reports = {};


function reapOldReports() {
  logger.info('starting reap cycle on reports: ', _.keys(reports).length);
  _.each(_.keys(reports), function(key) {
    var report = reports[key];
    var age = Math.round(((new Date()).getTime() - report.reported)/1000);
    if (age >= config.reapAge) {
      logger.info('reaping stale report for: {}:{}', report.host, report.port);
      delete reports[key];
    }
  });
}

poller.emitter.on('report', function(report) {
  var key = report.host + ':' + report.port;
  reports[key] = report;
});

app.configure(function() {
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/pages', { maxAge: 60*60*1000 }));
    app.use(express.static(__dirname + '/static', { maxAge: 3*24*60*60*1000 }));
    app.use(express.compress());
});

app.configure(function(){
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/reports', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'public, max-age=' + 10);
  res.send(JSON.stringify(reports));
  res.end();
});

logger.info('starting web UI on port: ', config.httpPort);
app.listen(config.httpPort);
poller.startPollingMasterServer();
setInterval(reapOldReports, config.reapInterval*1000);
