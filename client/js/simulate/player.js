/* global define, _ */
define(['shared', 'input'], function (shared, inp) {
  'use strict';

  var SPEED = 3;

  var canvas;
  var img;
  var map;

  var WIDTH = 96 / 3;  // frame
  var HEIGHT = 128 / 4; // dir

  var DOWN = 0;
  var LEFT = 1;
  var RIGHT = 2;
  var UP = 3;

  var FRAMES = 3;
  var ANIMTIME = 100;

  var x = 0;
  var y = 0;
  var curFrame = 0;
  var animTime = 0;
  var curDir = 0;

  function init(_canvas, _map) {
    x = (_map.x || 0) * 40;
    y = (_map.y || 0) * 40;

    canvas = _canvas;
    inp.init();
    img = shared.get('img').player;
    map = _map;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  }

  function update(dTime) {
    var isMoving = false;

    if (inp.down()) {
      curDir = DOWN;
      isMoving = move(0, 1) || isMoving;
    }

    if (inp.up()) {
      curDir = UP;
      isMoving = move(0, -1) || isMoving;
    }

    if (inp.left()) {
      curDir = LEFT;
      isMoving = move(-1, 0) || isMoving;
    }

    if (inp.right()) {
      curDir = RIGHT;
      isMoving = move(1, 0) || isMoving;
    }

    if (isMoving) {
      animTime += 20;
      if (animTime > ANIMTIME) {
        curFrame++;
        animTime = 0;
        if (curFrame >= FRAMES) {
          curFrame = 0;
        }
      }
    }
    else {
      animTime = 0;
      curFrame = 0;
    }
  }

  function move(dx, dy) {
    var oldX = x;
    var oldY = y;
    x += dx * SPEED;
    y += dy * SPEED;

    // bounds check
    if (x < 0) {
      x = 0;
      return false;
    }

    if (y < 0) {
      y = 0;
      return false;
    }

    // TODO:: 600 is hard coded, put in map w and h * 40
    if (x > map.width * 40 - WIDTH) {
      x = map.width * 40 - WIDTH;
      return false;
    }

    if (y > map.height * 40 - HEIGHT) {
      y = map.height * 40 - HEIGHT;
      return false;
    }

    if (isCollision()) {
      x = oldX;
      y = oldY;
      return false;
    }

    return true;
  }

  function isCollision() {
    var _collision = false;
    _.each(map.events, function (e) {
      if (_collision) return;
      if (e.id) {
        if (collides(x, y, e.x*40, e.y*40)) {
          _collision = true;
        }
      }
    });
    if (_collision) return true;

    // use map.data.middle
    // check with x and y and WIDTH and HEIGHT
    // return true if collision exists
  }

  function collides(x, y, x2, y2) {
    if (x + WIDTH > x2 && x < x2 + WIDTH) {
      if (y + HEIGHT > y2 && y < y2 + WIDTH) {
        return true;
      }
    }
  }

  function render(ctx) {
    canvas.style.top = y + 'px';
    canvas.style.left = x + 'px';

    var sx = curFrame * WIDTH;
    var sy = curDir * HEIGHT;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(img, sx, sy, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);
  }

  return {
    init: init,
    update: update,
    render: render
  };
});
