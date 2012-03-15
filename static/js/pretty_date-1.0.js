"use strict";

function prettyDate(seconds){
  var time_formats = [
    [0,           'now',            'now',                null],
    [10,          'seconds ago',    'now',                null],
    [60,          '< 1 minute ago', '< 1 minute from now', null],
    [120,         '1 minute ago',   '1 minute from now',  null],
    [3600,        'minutes ago',    'minutes from now',   60],
    [7200,        '1 hour ago',     '1 hour from now',    null],
    [86400,       'hours ago',      'hours from now',     3600],
    [172800,      'yesterday',      'tomorrow',           null],
    [604800,      'days ago',       'days from now',      86400],
    [1209600,     'last week',      'next week',          null],
    [2419200,     'weeks ago',      'weeks from now',     604800],
    [4838400,     'last month',     'next month',         null],
    [29030400,    'months ago',     'months from now',    2419200],
    [58060800,    'last year',      'next year',          null],
    [2903040000,  'years ago',      'years from now',     29030400],
    [5806080000,  'last century',   'next century',       null],
    [58060800000, 'centuries ago',  'centuries from now', 2903040000]
  ];
  var past = false;
  if (seconds <= 0) {
    seconds = Math.abs(seconds);
    past = true;
  }
  var n = time_formats.length;
  for (var i = 0; i < n; i++) {
    var format = time_formats[i];
    var limit = format[0];
    var formatString = (past ? format[1] : format[2]);
    var divisor = format[3];
    if (seconds < limit) {
      if (divisor) {
        return Math.floor(seconds/divisor) + ' ' + formatString;
      } else {
        return formatString;
      }
    }
  };
  return (past ? 'a long time ago' : 'a long time from now');
}
