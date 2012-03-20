"use strict";

var logger = require('nlogger').logger(module);
var _ = require('underscore');


// see shared/cube2font.c in RE source
var cube2unichars =
[
    0, 192, 193, 194, 195, 196, 197, 198, 199, 9, 10, 11, 12, 13, 200, 201,
    202, 203, 204, 205, 206, 207, 209, 210, 211, 212, 213, 214, 216, 217, 218, 219,
    32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47,
    48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63,
    64, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77, 78, 79,
    80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95,
    96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111,
    112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123, 124, 125, 126, 220,
    221, 223, 224, 225, 226, 227, 228, 229, 230, 231, 232, 233, 234, 235, 236, 237,
    238, 239, 241, 242, 243, 244, 245, 246, 248, 249, 250, 251, 252, 253, 255, 0x104,
    0x105, 0x106, 0x107, 0x10C, 0x10D, 0x10E, 0x10F, 0x118, 0x119, 0x11A, 0x11B, 0x11E, 0x11F, 0x130, 0x131, 0x141,
    0x142, 0x143, 0x144, 0x147, 0x148, 0x150, 0x151, 0x152, 0x153, 0x158, 0x159, 0x15A, 0x15B, 0x15E, 0x15F, 0x160,
    0x161, 0x164, 0x165, 0x16E, 0x16F, 0x170, 0x171, 0x178, 0x179, 0x17A, 0x17B, 0x17C, 0x17D, 0x17E, 0x404, 0x411,
    0x413, 0x414, 0x416, 0x417, 0x418, 0x419, 0x41B, 0x41F, 0x423, 0x424, 0x426, 0x427, 0x428, 0x429, 0x42A, 0x42B,
    0x42C, 0x42D, 0x42E, 0x42F, 0x431, 0x432, 0x433, 0x434, 0x436, 0x437, 0x438, 0x439, 0x43A, 0x43B, 0x43C, 0x43D,
    0x43F, 0x442, 0x444, 0x446, 0x447, 0x448, 0x449, 0x44A, 0x44B, 0x44C, 0x44D, 0x44E, 0x44F, 0x454, 0x490, 0x491
];


// see engine/server.cpp in RE source
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


// see engine/server.cpp in RE source
function readString(buf, offset) {
  var start = offset;
  var end = start;
  var str = '';
  while (buf[end] != 0 && end < buf.length) {
    str = str + String.fromCharCode(cube2unichars[buf[end]]);
    end++;
  }
  //return [buf.toString('utf8', start, end), end + 1];
  return [str, end + 1];
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
