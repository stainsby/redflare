$(function($) {

  var DESKTOP_NOTIFICATION_TIMEOUT_MILLIS = 10*1000;
  var MOBILE_NOTIFICATION_TIMEOUT_MILLIS = 100*1000;

  // TODO:
  //   - add settings, initially with minimum player count threshold
  //   - have (option of?) one replaceable notification?


  // Appropriated from https://www.html5rocks.com/en/tutorials/pagevisibility/intro/.
  function getHiddenProp() {
      var prefixes = ['webkit','moz','ms','o'];
      if ('hidden' in document) return 'hidden';
      for (var i = 0; i < prefixes.length; i++) {
          if ((prefixes[i] + 'Hidden') in document)
              return prefixes[i] + 'Hidden';
      }
      return null;
  }
  function isHidden() {
    var prop = getHiddenProp();
    if (!prop) return false;
    return document[prop];
  }


  function getStoredObject(key) {
    var obj = window.localStorage.getItem(key) || null;
    if (obj) {
      try {
        obj = JSON.parse(obj);
      } catch (err) {
        obj = null;
      }
    }
    return obj;
  }


  function saveStoredObject(key, obj) {
    window.localStorage.setItem(key, JSON.stringify(obj));
  }


  var status = $('.notify-controls .status');


  if (!('Notification' in window) || !('localStorage' in window)) {
    status.html('N/A');
    return;
  }


  var swRegistration = null;
  if (navigator && navigator.serviceWorker) {
    navigator.serviceWorker.register('sw.js').then(function(registration) {
      swRegistration = registration;
    });
  }


  var swMessageListener = null;


  function sendNotification(title, message, data) {

    // Don't sent notifications if the page is visible.
    var visible = !isHidden();
    if (visible) {
      return;
    }

    if (!swMessageListener) {
      swMessageListener = true;
      // Get messages from the service worker - eg. as a result of the 'mute' action on a notification.
      navigator.serviceWorker.addEventListener('message', function(event) {
        var action = event && event.data && event.data.action;
        if (action === 'hush') {
          stopMonitoring();
        }
      });
    }

    var actions = [
      {
        action: 'hush',
        title: 'Mute Notifications',
        icon: '/icons/actions/bell-slash-o.png'
      },
      {
        action: 'focus',
        title: 'Go To Redflare',
        icon: '/icons/actions/external-link.png'
      }
    ];
    var options = {
      body: message,
      icon: '/favicon.ico'
    };
    if (data) {
      options.data = data;
    }

    if (swRegistration) {
      options.actions = actions;
      swRegistration.showNotification(title, options);
    }
  }


  var monitoring = false;
  var TEN_MINUTES = 10*60*1000; // milliseconds


  $('body').on('redflareReports', function(event, reports) {
    if (monitoring) {
      $.each(reports, function(server_id, report) {
        numClients = report.clients;
        if (report.clients > 0) {
          var notifieds = getStoredObject("notifieds") || {};
          // If we have already sent a notification about this in the last ten minutes, ignore the game.
          serverId = report.host + ':' + report.port;
          var now = new Date().getTime();
          if (!notifieds[serverId] || (now - notifieds[serverId]) > TEN_MINUTES) {
            var plural = report.clients > 1;
            var playerStr = 'player' + (plural && 's' || '');
            sendNotification(
              'Red Eclipse Game On!',
              '' + numClients + ' ' + playerStr + ' on "' + report.description + '" [' + report.country + '] right now.',
              {numClients: numClients, serverId: serverId, country: report.country, created: Date.now()}
            );
            notifieds[serverId] = now;
            saveStoredObject("notifieds", notifieds);
          }
        }
      });
    }
  });


  function startMonitoring() {
    monitoring = true;
    var settings = getStoredObject("settings") || {};
    settings.notifyMute = false;
    saveStoredObject("settings", settings);
    status.html('ON');
  }


  function stopMonitoring() {
    monitoring = false;
    var settings = getStoredObject("settings") || {};
    settings.notifyMute = true;
    saveStoredObject("settings", settings);
    status.html('OFF');
  }


  status.click(function() {
    var permission = Notification.permission;
    if (permission === 'default') {
      Notification.requestPermission(function (permission) {
        if (permission === 'granted') {
          startMonitoring();
        } else {
          stopMonitoring();
        }
      });
    } else if (permission === 'granted') {
      if (monitoring) {
        stopMonitoring();
      } else {
        startMonitoring();
      }
    } else {
      status.html('BLOCKED');
    }
  });

  var permission = Notification.permission;
  if (permission === 'default') {
    status.html('CLICK ME!');
  } else if (permission === 'granted') {
    var settings = getStoredObject("settings") || {};
    monitoring = !settings.notifyMute;
    if (monitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  } else { // denied
    monitoring = false;
    status.html('BLOCKED');
  }

});
