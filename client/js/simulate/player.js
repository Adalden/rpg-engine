/* global define, _, $ */
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

  var SCREEN_WIDTH = 600;
  var SCREEN_HEIGHT = 600;
  var TILESIZE = 40;

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

    if (x > SCREEN_WIDTH - WIDTH) {
      x = SCREEN_WIDTH - WIDTH;
      return false;
    }

    // if (x > map.width * TILESIZE - WIDTH) {
    //   x = map.width * TILESIZE - WIDTH;
    //   return false;
    // }

    if (y > SCREEN_HEIGHT - HEIGHT) {
      y = SCREEN_HEIGHT - HEIGHT;
      return false;
    }

    // if (y > map.height * TILESIZE - HEIGHT) {
    //   y = map.height * TILESIZE - HEIGHT;
    //   return false;
    // }

    if (isCollision()) {
      x = oldX;
      y = oldY;
      return false;
    }

    if (x > SCREEN_WIDTH / 2) {
      var oldPos = $('.move-me').position();

      if (oldPos.left >= -(map.width * TILESIZE - SCREEN_WIDTH)) {
        x = oldX;
        var newLeft = oldPos.left - dx * SPEED;
        $('.move-me').css('left', newLeft + 'px');
      }
    }

    if (x < SCREEN_WIDTH / 2) {
      var oldPos = $('.move-me').position();

      if (oldPos.left < 0) {
        x = oldX;
        var newLeft = oldPos.left - dx * SPEED;
        $('.move-me').css('left', newLeft + 'px');
      }
    }

    if (y > SCREEN_HEIGHT / 2) {
      var oldPos = $('.move-me').position();

      if (oldPos.top >= -(map.height * TILESIZE - SCREEN_HEIGHT)) {
        y = oldY;
        var newTop = oldPos.top - dy * SPEED;
        $('.move-me').css('top', newTop + 'px');
      }
    }

    if (y < SCREEN_HEIGHT / 2) {
      var oldPos = $('.move-me').position();

      if (oldPos.top < 0) {
        y = oldY;
        var newTop = oldPos.top - dy * SPEED;
        $('.move-me').css('top', newTop + 'px');
      }
    }

    return true;
  }

  function isCollision() {
    var _collision = false;
    _.each(map.events, function (e) {
      if (_collision) return;
      if (e.id) {
        if (collides(x, y, e.x * TILESIZE, e.y * TILESIZE)) {
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
