"use strict";

//var listingTemplate = Handlebars.compile($("#listing-template").html());
var listingTemplate = null;
var tableSortList = null;

function loadLatestReport() {
  var req = $.get('/reports');
  req.success(function(reports) {
    var playerCount = 0;
    var serverCount = 0;
    var activeServerCount = 0;
    var reportList = _.map(
      _.keys(reports),
      function(key) {
        var report = reports[key];
        playerCount = playerCount + report.clients;
        serverCount++;
        if (report.clients > 0) activeServerCount++;
        report.lastSeen = '' + prettyDate(-Math.round(((new Date()).getTime() - report.reported)/1000));
        var fullness = report.clients/report.maxClients;
        if (fullness > 1) fullness = 1; // maxClients doesn't count admins
        report.fullness = '' + Math.round(fullness*100) + '%';
        report.gameMode = report.gameMode;
        report.mutators = report.mutators.join('-');
        report.remaining = Math.round(report.timeLeft/60);
        var playerNames = _.map(report.playerNames, function(name) {
          return name.plain;
        });
        report.names = playerNames.join(', ');
        var cssClasses = [];
        if (report.clients == 0) {
          cssClasses.push('empty');
        } else if (report.clients == report.maxClients) {
          cssClasses.push('full');
        }
        if (report.masterMode != 'open') {
          cssClasses.push('notopen');
        }
        report.cssClasses = cssClasses.join(' ');
        var heatColorHSL = [
          180 - Math.round(fullness*180),
          (15 + Math.round(fullness*85)) + '%',
          (10 + Math.round(fullness*40)) + '%'
        ];
        if (fullness == 0) {
          report.heatColor = '#161616';
        } else if (fullness == 1) {
          report.heatColor = '#f00';
        } else {
          report.heatColor = 'hsl(' + heatColorHSL.join(', ') + ')';
        }
        return report;
      }
    );
    $('#content').html(listingTemplate(
      {
        reports : reportList,
        playerCount : playerCount,
        serverCount : serverCount,
        activeServerCount : activeServerCount
      }
    ));
    $('.serverlist').tablesorter({ 
      sortInitialOrder: 'desc',
      sortList: (tableSortList ? tableSortList : [[0,1]]),
      headers: { 
        9 : { sorter: false  }
      } 
    }).bind("sortEnd", function(sorter) {
      tableSortList = sorter.target.config.sortList;
    });
  });
}

$(function($) {
  $("link[type='application/x-handlebars-template']").each(function() {
    var templateUrl = $(this).attr('href');
    var templateName = $(this).data('template');
    if (templateName == 'listing-template') {
      $.get(templateUrl, function(data) {
        listingTemplate = Handlebars.compile(data);
        loadLatestReport();
        setInterval(loadLatestReport, 15*1000);
      });
    }
  });
});
