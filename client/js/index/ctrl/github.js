/* global define, Handlebars */
define(['text!tmpl/github.html'], function (githubTmpl) {
  'use strict';

  function init() {
    // start getting data
    var vals = createDummyData();
    githubTmpl = Handlebars.compile(githubTmpl);
    githubTmpl = githubTmpl(vals);
  }

  function render(el) {
    // got focus
    el.html(githubTmpl);
  }

  function destroy() {
    // lost focus
  }

  function createDummyData() {
    var repos = [
      { name: 'Engine', code: 'https://github.com/numso/zombie-attack' },
      { name: 'Instructors', demo: 'http://rpg-map-editor.aws.af.cm/#/', code: 'https://github.com/numso/rpg-map-editor' }
    ];

    for (var i = 1; i <= 10; ++i) {
      repos.push({
        name: 'Group' + i,
        demo: '#',
        code: '#'
      });
    }

    return { repos: repos };
  }

  return {
    init: init,
    render: render,
    destroy: destroy
  };
});
