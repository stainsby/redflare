"use strict";

var logger = require('nlogger').logger(module);
var _ = require('underscore');


function readInt(buf, offset) {
  var ch1 = buf.readInt8(offset);
  var result;
  if (ch1 == -128) {
    result = [buf.readInt16LE(offset + 1), offset + 3];
  } else if (ch1 == -127) {
    result = [buf.readInt32LE(offset + 1), offset + 5];
  }
  else {
    result = [ch1, offset + 1];
  }
  return result;
}


function readString(buf, offset) {
  var start = offset;
  var end = start;
  while (buf[end] != 0 && end < buf.length) {
    end++;
  }
  return [buf.toString('utf8', start, end), end + 1];
}

var mutators = {
  multi       : 1 << 0,
  team        : 1 << 1,
  insta       : 1 << 2,
  medieval    : 1 << 3,
  ballistic   : 1 << 4,
  duel        : 1 << 5,
  survivor    : 1 << 6,
  arena       : 1 << 7,
  onslaught   : 1 << 8,
  hover       : 1 << 9,
  jetpack     : 1 << 10,
  vampire     : 1 << 11,
  expert      : 1 << 12,
  resize      : 1 << 13
}
function mutatorsFromFlags(flags) {
  var muts = [];
  _.each(_.keys(mutators), function(mutator) {
    if (flags & mutators[mutator]) muts.push(mutator);
  });
  return muts;
}


var masterModes = [
  'open',         // 0
  'veto',         // 1
  'locked',       // 2
  'private',      // 3
  'password'      // 4
]
function masterModeFromCode(code) {
  if (code < 0 || code > masterModes.length) {
    return 'unknown';
  } else {
    return masterModes[code];
  }
}


var gameModes = [
  'demo',                 // 0
  'edit',                 // 1
  'campaign',             // 2
  'deathmatch',           // 3
  'capture-the-flag',     // 4
  'defend-the-flag',      // 5
  'bomberball',           // 6
  'time-trial'            // 7
]
function gameModeFromCode(code) {
  if (code < 0 || code > gameModes.length) {
    return 'unknown';
  } else {
    return gameModes[code];
  }
}


function Stream(buffer, offset) {
  this.buffer = buffer;
  this.offset = offset;
  this.readNextInt = function() {
    var next = readInt(this.buffer, this.offset);
    this.offset = next[1];
    return next[0];
  }
  this.readNextString = function() {
    var next = readString(this.buffer, this.offset);
    this.offset = next[1];
    return next[0];
  }
}


if (typeof exports == 'object') {
  exports.Stream = Stream;
  exports.mutatorsFromFlags = mutatorsFromFlags;
  exports.masterModeFromCode = masterModeFromCode;
  exports.gameModeFromCode = gameModeFromCode;
}
