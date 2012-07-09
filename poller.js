"use strict";

var logger = require('nlogger').logger(module);
var net = require('net');
var udp = require('dgram');
var events = require('events');
var _ = require('underscore');
var async = require('async');
var geoip = require('geoip-lite');

var config = require('./config');
var protocol = require('./lib/protocol');


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
function processsServerReply(host, port, reply, batchId) {
  
  var report = {};
  
  var reported = new Date();
  var id = batchId + '_' + host + '_' + port;
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
  report.reported = reported.getTime();
  report.clients = stream.readNextInt();
  stream.readNextInt(); // reads no. of args following - not used
  report.gameVersion = stream.readNextInt();
  report.gameMode = protocol.gameModeFromCode(stream.readNextInt());
  var mutators = stream.readNextInt()
  report.mutatorFlags = mutators;
  report.mutators = protocol.mutatorsFromFlags(mutators);
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
  report.country = geoip.lookup(host).country;
  
  return report;
}


function startServerQuery(host, port, batchId, andThen) {
  logger.info('checking status of server: {}:{}', host, port);
  try {
    var client = null;
    var query = new Buffer(5);
    query.writeUInt8(0x81, 0);
    query.writeUInt8(0xec, 1);
    query.writeUInt8(0x04, 2);
    query.writeUInt8(0x01, 3);
    query.writeUInt8(0x00, 4);
    client = udp.createSocket('udp4');
    client.on('message', function (reply) {
      client.close();
      client = null;
      try {
        logger.info('  .. procesing server reply for: {}:{}', host, port);
        var report = processsServerReply(host, port, reply, batchId);
        logger.debug('report: {}', JSON.stringify(report));
        emitter.emit('report', report);
        andThen();
      }  catch(err) {
        logger.warn('server reply processing failed: ', err);
        andThen();
      }
    });
    client.on('error', function (err) {
      client.close();
      client = null;
      logger.warn('server connection failed: ', err);
      andThen();
    });
    client.send(query, 0, query.length, port, host);
    // manually implement a UPD socket "timeout"
    var closeSocket = function() {
      if (client != null) {
        logger.warn('server query timed out');
        client.close();
        client = null;
        andThen();
      }
    }
    setTimeout(closeSocket, 2000)
  } catch(err) {
    logger.warn('server query failed with uncaught error: ', err);
    if (client != null) {
      client.close();
      client = null;
    }
    andThen();
  }
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
      var batchId = (new Date()).toISOString();
      async.forEachSeries(
        servers,
        function(server, andThen) {
          startServerQuery(server[0], server[1] + 1, batchId, andThen);
        },
        function(err) {
          if (err) {
            logger.error('while checking servers: {}', err);
          } else {
            logger.info('servers checked');
          }
        }
      )
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
