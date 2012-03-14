"use strict";

var logger = require('nlogger').logger(module);
var net = require('net');
var udp = require('dgram')
var config = require('./config');
var protocol = require('./lib/protocol');
var events = require('events');
var _ = require('underscore');


var emitter = new events.EventEmitter();


var colorPrefix = '\fs\f';
function uncolorString(name)  {
  if (name.indexOf(colorPrefix) == 0) {
    var start = name.indexOf(']') + 1;
    return name.slice(start).slice(0, -2);
  } else {
    return name;
  }
}


function leftZeroPad(s, n) {
  while(s.length < n) {
    s = '0' + s;
  }
  return s;
}


var lastChecked = null;
var lastIdCounter = 0;
function processsServerReply(host, port, reply, checked) {
  
  var report = {};
  
  var reported = new Date();
  var id = host + '_' + port + '_' + reported.toISOString();
  if (id == lastChecked) {
    lastIdCounter++;
  } else {
    lastIdCounter = 0;
  }
  lastChecked = id;
  id = id + '.' + leftZeroPad('' + lastIdCounter, 3);
  report._id = id;
  
  var stream = new protocol.Stream(reply, 5);
  
  report.host = host;
  report.port = port - 1;
  report.checked = checked.getTime();
  report.reported = reported.getTime();
  report.clients = stream.readNextInt();
  stream.readNextInt(); // reads no. of args following - not used
  report.gameVersion = stream.readNextInt();
  report.gameMode = protocol.gameModeFromCode(stream.readNextInt());
  report.mutators = protocol.mutatorsFromFlags(stream.readNextInt());
  report.timeLeft = stream.readNextInt();
  report.maxClients = stream.readNextInt();
  report.masterMode = protocol.masterModeFromCode(stream.readNextInt());
  report.variableCount = stream.readNextInt();
  report.modificationCount = stream.readNextInt();
  report.mapName = stream.readNextString();
  report.description = stream.readNextString();
  var playerNames = [];
  for (var i = 0; i < report.clients; i++) {
    var rawName = stream.readNextString();
    playerNames.push({
      raw : rawName,
      plain : uncolorString(rawName)
    });
  }
  report.playerNames = playerNames;
  
  return report;
}


function startServerQuery(host, port, reported) {
  logger.info('checking status of server: {}:{}', host, port);
  var query = new Buffer(5);
  query.writeUInt8(0x81, 0);
  query.writeUInt8(0xec, 1);
  query.writeUInt8(0x04, 2);
  query.writeUInt8(0x01, 3);
  query.writeUInt8(0x00, 4);
  var client = udp.createSocket('udp4');
  client.on('message', function (reply) {
    client.close();
    var report = processsServerReply(host, port, reply, reported);
    logger.debug('report: {}', JSON.stringify(report));
    emitter.emit('report', report);
  });
  client.send(query, 0, query.length, port, host);
}


function pollMasterServer() {
  try {
    logger.info('polling master server');
    var client = net.connect(
      config.masterServer.port,
      config.masterServer.host,
      function() {
        logger.debug('polling socket connected');
      }
    );
    client.setEncoding('ascii');
    var allData = '';
    client.on('data', function(data) {
      allData = allData + data;
    });
    client.on('end', function() {
      logger.debug('polling socket closed normally');
      var servers = [];
      var lines = allData.split('\n');
      _.each(lines, function(line) {
        if (line.indexOf('addserver ') == 0) {
          var parts = line.split(' ');
          servers.push([parts[1], parseInt(parts[2])]);
        }
      });
      logger.info('found {} servers', servers.length);
      var reported = new Date();
      function queryNext() {
        if (servers.length > 0) {
          var server = servers[0];
          startServerQuery(server[0], server[1] + 1, reported);
          servers.shift();
          setTimeout(queryNext, config.serverQueryThrottle);
        }
      }
      queryNext();
      logger.info('LOOP EXIT');
    });
    client.write('update\n');
  } catch (err) {
    logger.error('while polling master server: {}', err);
  }
}


function startPollingMasterServer() {
  pollMasterServer();
  setInterval(pollMasterServer, config.pollingInterval*1000);
}


if (typeof exports == 'object') {
  exports.startPollingMasterServer = startPollingMasterServer;
  exports.emitter = emitter;
}
