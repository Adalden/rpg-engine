/* global requirejs, define, $, console */
requirejs.config({
  paths: {
    text: '/js/lib/text'
  }
});

define(['tools', 'game-engine'], function (tools, gameEngine) {
  'use strict';

  function init() {
    getMap(function (err, map) {
      $('.loading').remove();

      if (err) {
        console.error(err);
        $('.err').text(JSON.stringify(err));
        return;
      }

      tools.loadImages(function () {
        gameEngine.init(map);
        gameEngine.start();
      });

      $('.err').remove();
    });
  }

  function getMap(cb) {
    var id = tools.getQS('id');
    if (!id) return cb('No ID was given.');

    $.get('/map/' + id, function (data) {
      if (!data.success) {
        return cb(data.err);
      }

      cb(null, data.map);
    });
  }

  init();
});
