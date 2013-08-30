/* global define, $ */
define(['text!tmpl/home.html'], function (homeTmpl) {
  'use strict';

  var navigate;

  function init(fn) {
    // start getting data
    navigate = fn;
  }

  function render(el) {
    // got focus
    el.html(homeTmpl);
    bindListeners();
  }

  function destroy() {
    // lost focus
  }

  function bindListeners() {
    $('.za-screens').click(function () {
      navigate($('.za-nav-screens'));
    });

    $('.za-maps').click(function () {
      navigate($('.za-nav-maps'));
    });
  }

  return {
    init: init,
    render: render,
    destroy: destroy
  };
});
