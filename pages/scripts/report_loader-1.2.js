"use strict";

var tableSortList = null;

/**
 * Places listing into the '#content' element using 'listingTemplate', which
 * is loaded by the template loader script elsewhere.
 * Also requires tablesorter extension.
 */
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
        try {
          playerCount = playerCount + report.clients;
          serverCount++;
          if (report.clients > 0) activeServerCount++;
          report.lastSeen = '' + prettyDate(-Math.round(((new Date()).getTime() - report.reported)/1000));
          var fullness = report.clients/report.maxClients;
          if (fullness > 1) fullness = 1; // maxClients doesn't count admins
          report.fullness = '' + Math.round(fullness*100) + '%';
          report.gameMode = report.gameMode;
          report.mutators = report.mutators.join(' ');
          report.remaining = Math.round(report.timeLeft/60);
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
        } catch(err) {
          //console.log("WARNING: failed to load: ", key, "\nerror was:\n", err, "\nreport was:\n", report);
        }
        return report;
      }
    );
    // pre-sort list for use in mobile UI
    reportList = _.sortBy(reportList, function(report) { return -report.clients; })
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
