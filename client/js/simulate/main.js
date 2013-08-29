/* global requirejs, define, $, console */

function getParameterByName(name) {
  'use strict';
  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

requirejs.config({
  paths: {
    text: '/js/lib/text'
  }
});

define([], function () {
  'use strict';

  init();

  function init() {
    getMap(function (err, map) {
      $('.loading').remove();

      if (err) {
        console.error(err);
        $('.err').text(JSON.stringify(err));
        return;
      }

      $('.err').text(JSON.stringify(map));

      // grab the canvi
      // load the game!!
    });
  }

  function getMap(cb) {
    var id = getParameterByName('id');
    if (!id) return cb('No ID was given.');

    $.get('/map/' + id, function (data) {
      if (!data.success) {
        return cb(data.err);
      }

      cb(null, data.map);
    });
  }
});
