/* global define, _ */
define(['shared'], function (shared) {
  'use strict';

  var imgNames = ['bottom', 'middle', 'top', 'events', 'player'];

  function getParameterByName(name) {
    name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
    var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    var results = regex.exec(location.search);
    return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
  }

  function loadImages(cb) {
    var imgs = {};
    var finish = _.after(imgNames.length, function () {
      shared.set('img', imgs);
      cb();
    });
    _.each(imgNames, function (name) {
      imgs[name] = new Image();
      imgs[name].onload = finish;
      imgs[name].src = 'img/' + name + '.png';
    });
  }

  return {
    getQS: getParameterByName,
    loadImages: loadImages
  };
});
