/* global define, $, Handlebars */
define(['text!tmpl/play-maps.html', 'text!tmpl/play-maps-list.html'], function (playMapsTmpl, playMapsListTmpl) {
  'use strict';

  var finished = false;

  function init() {
    // start getting data
    playMapsListTmpl = Handlebars.compile(playMapsListTmpl);
    $.get('/maps/all', function (resp) {
      if (!resp.success) {
        playMapsListTmpl = playMapsListTmpl({ err: resp.err });
      }
      else {
        playMapsListTmpl = playMapsListTmpl({ maps: resp.maps, url: resp.baseUrl });
      }
      finished = true;
      $('.za-map-container').html(playMapsListTmpl);
    });
  }

  function render(el) {
    // got focus
    el.html(playMapsTmpl);
    if (finished) {
      $('.za-map-container').html(playMapsListTmpl);
    }
  }

  function destroy() {
    // lost focus
  }

  return {
    init: init,
    render: render,
    destroy: destroy
  };
});
