self.addEventListener('notificationclick', function(event) {
  var action = event.action || null;
  event.waitUntil(self.clients.matchAll({type: 'window'}).then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({ action: action });
      if (action === 'focus') {
        if ('focus' in client) {
          client.focus();
        }
      }
    });
  }));
  event.notification.close();
});


function cleanup() {
  // close any old notifications
  self.registration.getNotifications().then(function(notifications) {
    notifications.forEach(function(notification) {
      var data = notification.data;
      var ageInMinutes = (Date.now() - data.created)/(60*1000);
      if (ageInMinutes > 10) {
        notification.close();
      }
    });
  });
}


setInterval(cleanup, 5*1000); // TODO make this interval much longer eg. 2 minutes
cleanup();
