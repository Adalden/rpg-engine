/* global requirejs, define, $ */

function noop() {}

requirejs.config({
  paths: {
    text: '/js/lib/text'
  }
});

define([
  'text!tmpl/home.html',
  'text!tmpl/high-scores.html',
  'text!tmpl/screenshots.html',
  'text!tmpl/github.html'
], function (
  homeTmpl,
  scoresTmpl,
  screensTmpl,
  githubTmpl
) {
  'use strict';

  var mapping = {
    Home: {
      tmpl: homeTmpl,
      bind: bindHome
    },
    'High Scores': {
      tmpl: scoresTmpl,
      bind: noop
    },
    Screenshots: {
      tmpl: screensTmpl,
      bind: noop
    },
    Github: {
      tmpl: githubTmpl,
      bind: noop
    }
  };

  function setup() {
    $('.za-nav-btn').click(function () {
      var $this = $(this);
      var obj = mapping[$this.text()];
      clickedItem($this, obj);
    });

    $('.za-container').html(mapping.Home.tmpl);
    mapping.Home.bind();
  }

  function bindHome() {
    $('.za-screens').click(function () {
      clickedItem($('.za-nav-screens'), mapping.Screenshots);
    });
  }

  function clickedItem($this, obj) {
    $('.active').removeClass('active');
    $this.addClass('active');
    $('.za-container').html(obj.tmpl);
    obj.bind();
  }

  setup();
});
