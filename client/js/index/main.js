/* global requirejs, define, $, _ */

requirejs.config({
  paths: {
    text: '/js/lib/text'
  }
});

define([
  'ctrl/home',
  'ctrl/play-maps',
  'ctrl/screenshots',
  'ctrl/high-scores',
  'ctrl/github',
], function (
  homeCtrl,
  playMapsCtrl,
  screenshotsCtrl,
  highScoresCtrl,
  githubCtrl
) {
  'use strict';

  function navigate($this) {
    var ctrl = ctrls[$this.text()];
    if (cur === ctrl) return;
    $('.active').removeClass('active');
    $this.addClass('active');

    cur.destroy();
    ctrl.render(el);
    cur = ctrl;
  }

  var ctrls = {
    Home: homeCtrl,
    'Play Maps': playMapsCtrl,
    Screenshots: screenshotsCtrl,
    'High Scores': highScoresCtrl,
    Github: githubCtrl
  };

  _.each(ctrls, function (ctrl) {
    ctrl.init(navigate);
  });

  $('.za-nav-btn').click(function () {
    var $this = $(this);
    navigate($this);
  });

  var hash = window.location.hash || '#Home';
  hash = hash.substr(1);
  hash = hash.replace(/%20/g, ' ');

  var el = $('.za-container');
  var cur = ctrls[hash] || ctrls.Home;
  cur.render(el);
  var btn = _.find($('.za-nav-btn'), function (btn) {
    return $(btn).text() == hash;
  });
  $(btn).addClass('active');
});
