var config = {
  masterServer : {
    host : "play.redeclipse.net",
    port : 28800
  },
  pollingInterval : 60,
  serverQueryThrottle : 1000,
  database : {
    name   : "redflare",
    host   : "127.0.0.1",
    port   : 5984,
    secure : false
  }
};

module.exports = config;
