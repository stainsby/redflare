"use strict";

var logger = require('nlogger').logger(module);
var net = require('net');
var udp = require('dgram')
var config = require('./config');
var protocol = require('./lib/protocol');


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
function processsServerReply(host, port, reply) {
  
  var checked = new Date();
  var report = {};
  var offset = 5;
  var next;
  
  var id = checked.toISOString();
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
  report.clients = stream.readNextInt();
  report.args = stream.readNextInt();
  report.gameVersion = stream.readNextInt();
  report.gameMode = stream.readNextInt();
  report.mutatorFlags = stream.readNextInt();
  report.timeLeft = stream.readNextInt();
  report.maxClients = stream.readNextInt();
  report.masterMode = stream.readNextInt();
  report.variableCount = stream.readNextInt();
  report.modificationCount = stream.readNextInt();
  report.mapName = stream.readNextString();
  report.serverDescription = stream.readNextString();
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


function startServerCheck(host, port) {
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
    var report = processsServerReply(host, port, reply);
    logger.debug('    report: {}', JSON.stringify(report));
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
      lines.forEach(function(line) {
        if (line.indexOf('addserver ') == 0) {
          var parts = line.split(' ');
          servers.push([parts[1], parseInt(parts[2])]);
        }
      });
      logger.info('found {} servers', servers.length);
      servers.forEach(function(server) {
        startServerCheck(server[0], server[1] + 1);
      });
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


startPollingMasterServer();
