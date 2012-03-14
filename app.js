"use strict";

var express = require('express');
var poller = require('./poller');

var app = module.exports = express.createServer();
var lastReport = {};

poller.emitter.on('report', function(report) {
  var key = report.host + ':' + report.port;
  lastReport[key] = report;
});

app.configure(function(){
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/static', { maxAge: 10*60 })); // TODO: age
});

app.get('/lastreport', function(req, res){
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(lastReport));
  res.end();
});

poller.startPollingMasterServer()
app.listen(28080);
