/* global define */
define(['text!tmpl/screenshots.html'], function (screenshotsTmpl) {
  'use strict';

  function init() {
    // start getting data
  }

  function render(el) {
    // got focus
    el.html(screenshotsTmpl);
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
