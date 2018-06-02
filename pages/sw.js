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

self.addEventListener('install', function(e) {
 e.waitUntil(
   caches.open('redflare').then(function(cache) {
     return cache.addAll([
       '/',
       '/index.html',
       '/mobile.html',
       '/index.html?utm_source=a2hs',
       '/mobile.html?utm_source=a2hs',
       '/favicon.ico',
       '/less/elements-0.6.less',
       '/less/theme-1.0.less',
       '/less/main-1.0.less',
       '/flags-css/flag-icon.min.css',
       '/templates/listing_template-1.0.html',
       '/js/underscore-1.3.1.min.js',
       '/js/jquery-1.7.1.min.js',
       '/js/less-1.3.0.min.js',
       '/js/handlebars.-4.0.5.min.js',
       '/js/pretty_date-1.0.js',
       '/js/jquery.tablesorter-2.0.5b.min.js',
       '/scripts/report_loader-1.2.js',
       '/scripts/template_loader-1.0.js',
       '/scripts/notifier-1.0.js',
       '/fonts/ProstoOne-Regular.ttf'
     ]);
   })
 );
});

self.addEventListener('fetch', function(event) {
  console.log(event.request.url);
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return response || fetch(event.request);
    })
  );

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
