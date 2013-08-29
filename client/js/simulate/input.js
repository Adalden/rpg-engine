/* global define */
define([], function () {
  'use strict';

  var keys = [];

  function init() {
    document.addEventListener('keydown', function (e) {
      keys[e.keyCode] = true;
    });

    document.addEventListener('keyup', function (e) {
      keys[e.keyCode] = false;
    });
  }

  function up() {
    return keys[38];
  }

  function left() {
    return keys[37];
  }

  function down() {
    return keys[40];
  }

  function right() {
    return keys[39];
  }


  return {
    init: init,
    up: up,
    left: left,
    down: down,
    right: right
  };
});
