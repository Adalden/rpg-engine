/* global define, _, requestAnimationFrame */
define(['shared', 'player'], function (shared, player) {
  'use strict';

  var ctxNames = ['botMid', 'events', 'player', 'top', 'env'];
  var ctxs = {};

  var ts = 40;
  var cols = 8;
  var map;

  function init(_map) {
    var w =_map.width || _map.data.bottom[0].length;
    var h = _map.height || _map.data.bottom.length;
    setupContexts(w, h);
    var playerCanvas = document.getElementById('player');
    map = _map;
    player.init(playerCanvas, map);
  }

  function setupContexts(w, h) {
    _.each(ctxNames, function (name) {
      var canvas = document.getElementById(name);
      ctxs[name] = canvas.getContext('2d');
      if (name !== 'player') {
        canvas.width = w * ts;
        canvas.height = h * ts;
      }
    });
  }

  function start() {
    initialRender();
    requestAnimationFrame(gameLoop);
  }

  function gameLoop() {
    requestAnimationFrame(gameLoop);
    update();
    render();
  }

  function update() {
    player.update();

  }

  function render() {
    player.render(ctxs.player);
  }

  function initialRender() {
    var imgs = shared.get('img');

    drawLayer(ctxs.botMid, imgs.bottom, map.data.bottom);
    drawLayer(ctxs.botMid, imgs.middle, map.data.middle);
    drawLayer(ctxs.top,    imgs.top,    map.data.top);

    drawEvents(ctxs.events, imgs.events, map.events);
  }

  function drawEvents(ctx, img, events) {
    _.each(events, function (e) {
      if (e.id) {
        drawImage(ctx, img, 0, e.id, e.x, e.y);
      }
    });
  }

  function drawLayer(ctx, img, lyr) {
    _.each(lyr, function (row, i) {
      _.each(row, function (cell, j) {
        if (cell === null) return;
        var sx = cell % cols;
        var sy = Math.floor(cell / cols);
        drawImage(ctx, img, sx, sy, j, i);
      });
    });
  }

  function drawImage(ctx, img, sx, sy, x, y) {
    ctx.drawImage(img, sx * ts, sy * ts, ts, ts, x * ts, y * ts, ts, ts);
  }

  return {
    init: init,
    start: start
  };
});
