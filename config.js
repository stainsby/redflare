"use strict";

var config = {
  masterServer : {
    host : "play.redeclipse.net",
    port : 28800
  },
  pollingInterval : 60, // seconds
  serverQueryThrottle : 800, // milliseconds
  reapInterval: 60, // seconds
  reapAge: 300, // seconds
  httpPort: 28080
};

module.exports = config;
