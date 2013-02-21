
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
