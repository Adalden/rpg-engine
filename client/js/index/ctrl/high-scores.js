/* global define */
define(['text!tmpl/high-scores.html'], function (highScoresTmpl) {
  'use strict';

  function init() {
    // start getting data
  }

  function render(el) {
    // got focus
    el.html(highScoresTmpl);
    bindListeners();
  }

  function destroy() {
    // lost focus
  }

  function bindListeners() {

  }

  return {
    init: init,
    render: render,
    destroy: destroy
  };
});
