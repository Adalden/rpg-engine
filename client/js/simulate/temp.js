/* global PIXI, $, requestAnimationFrame, _ */
'use strict';

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (cb) { setTimeout(cb, 1000 / 60); };

var SPEED = 0.3;

var WIDTH = 1440;
var HEIGHT = 710;

var MAPWIDTH = 0;
var MAPHEIGHT = 0;

var ASPECT = WIDTH / HEIGHT;

var $window = $(window);
var lazyLayout = _.debounce(calculateLayout, 300);
$window.resize(lazyLayout);

function calculateLayout() {
  var newAspect = $window.width() / $window.height();
  if (ASPECT > newAspect) {
    $('canvas').removeClass('vcenter');
    $('canvas').addClass('hcenter');
  } else {
    $('canvas').removeClass('hcenter');
    $('canvas').addClass('vcenter');
  }
}

var PSIZE = 32;
var SIZE = 40;
var COLS = 8;
var ROWS = { bottom: 6, middle: 9, top: 1, events: 1 };

var playerX;
var playerY;

var renderer;
var stage;
var time;
var map;
var dMap;
var player = { bottom: true, left: true, right: true, top: true };
var curDir;

function loadContent() {
  var assets = ['img/bottom.png', 'img/middle.png', '/img/top.png', '/img/player.png'];
  var loader = new PIXI.AssetLoader(assets);
  loader.onComplete = function () {
    loadMapTextures();
    loadPlayerTextures();
    loadMap(function (err, aMap) {
      if (err) return $('.err').text(err);
      map = aMap;
      init();
    });
  };
  loader.load();
}

function init() {
  renderer = new PIXI.autoDetectRenderer(WIDTH, HEIGHT);
  $('body').append(renderer.view);
  calculateLayout();
  stage = new PIXI.Stage();
  createGameBoard();
  createPlayer();
  $('.loading').hide();
  requestAnimationFrame(animate);
  time = +new Date();
}

function loadMapTextures() {
  for (var key in ROWS) {
    var curTexture = new PIXI.Texture.fromImage('img/' + key + '.png');
    for (var i = 0; i < COLS; ++i) {
      for (var j = 0; j < ROWS[key]; ++j) {
        var tempTexture = new PIXI.Texture(curTexture, { x: i * SIZE, y: j * SIZE, width: SIZE, height: SIZE });
        PIXI.TextureCache[key + '-' + (j * COLS + i)] = tempTexture;
      }
    }
  }
}

function loadPlayerTextures() {
  var playerTexture = new PIXI.Texture.fromImage('img/player.png');
  var j = 0;
  for (var key in player) {
    for (var i = 0; i < 3; ++i) {
      var tempTexture = new PIXI.Texture(playerTexture, { x: i * PSIZE, y: j * PSIZE, width: PSIZE, height: PSIZE });
      PIXI.TextureCache['p' + key + '-' + i] = tempTexture;
    }
    ++j;
  }
}

function loadMap(cb) {
  var id = getParameterByName('id');
  if (!id) return cb('No ID was given.');
  $.get('/map/' + id, function (data) {
    if (!data.success) return cb(JSON.stringify(data.err));
    cb(null, data.map);
  });
}

function createGameBoard() {
  dMap = new PIXI.DisplayObjectContainer();
  for (var key in map.data) {
    var lyr = new PIXI.DisplayObjectContainer();
    for (var i = 0; i < map.data[key].length; ++i) {
      for (var j = 0; j < map.data[key][i].length; ++j) {
        var id = map.data[key][i][j];
        if (id === null) continue;
        var myKey = key + '-' + id;
        if (!PIXI.TextureCache[myKey]) continue;
        var tempSprite = PIXI.Sprite.fromFrame(myKey);
        tempSprite.position.x = j * SIZE;
        tempSprite.position.y = i * SIZE;
        lyr.addChild(tempSprite);
      }
    }
    dMap.addChild(lyr);
  }
  if (!map.data.middle) map.data.middle = [];

  stage.addChild(dMap);
  MAPWIDTH = map.data.bottom[0].length * SIZE;
  MAPHEIGHT = map.data.bottom.length * SIZE;
}

function createPlayer() {
  var sprite = new PIXI.DisplayObjectContainer();
  for (var key in player) {
    var newList = [];
    for (var i = 0; i < 3; ++i) {
      newList.push(new PIXI.Texture.fromFrame('p' + key + '-' + i));
    }
    player[key] = new PIXI.MovieClip(newList);
    player[key].visible = false;
    player[key].animationSpeed = 0.3;
    sprite.addChild(player[key]);
  }

  playerX = 0;
  playerY = 0;

  if (map.x) playerX = map.x * SIZE;
  if (map.y) playerY = map.y * SIZE;

  if (playerX > MAPWIDTH - PSIZE) playerX = MAPWIDTH - PSIZE;
  if (playerY > MAPHEIGHT - PSIZE) playerY = MAPHEIGHT - PSIZE;

  if (playerX < 0) playerX = 0;
  if (playerY < 0) playerY = 0;

  stage.addChild(sprite);
  player.spr = sprite;
  curDir = 'left';
  player[curDir].visible = true;
}

function animate() {
  var now = +new Date();
  var dTime = now - time;
  time = now;

  update(dTime);
  render();
  renderer.render(stage);
  requestAnimationFrame(animate);
}

function update(dTime) {
  if (dTime > 20) dTime = 20;
  movePlayer(dTime);
}

function movePlayer(dTime) {
  var newDir = false;
  if (inputs[37] && move(-dTime, 0)) {
    newDir = 'left';
  }
  else if (inputs[39] && move(dTime, 0)) {
    newDir = 'right';
  }

  if (inputs[38] && move(0, -dTime)) {
    newDir = 'top';
  }
  else if (inputs[40] && move(0, dTime)) {
    newDir = 'bottom';
  }

  if (newDir) {
    if (newDir !== curDir) {
      player[curDir].stop();
      player[curDir].visible = false;
      curDir = newDir;
    }
    player[curDir].play();
    player[curDir].visible = true;
  } else {
    player[curDir].stop();
  }
}

function move(dX, dY) {
  var newX = playerX + dX * SPEED;
  var newY = playerY + dY * SPEED;
  if (collides(newX, playerY)) return false;
  if (collides(playerX, newY)) return false;
  playerX = newX;
  playerY = newY;
  return true;
}

function collides(x, y) {
  if (checkBorders(x, y)) return true;

  for (var i = 0; i < map.data.middle.length; ++i) {
    for (var j = 0; j < map.data.middle[i].length; ++j) {
      var m = map.data.middle[i][j];
      if (m === null || m === undefined) continue;
      if (m < 0 || m > 70) continue;
      if (checkTile(x, y, PSIZE, PSIZE, j * SIZE, i * SIZE, SIZE, SIZE)) return true;
    }
  }
  return false;
}

function checkTile(x, y, w, h, x2, y2, w2, h2) {
  if (x < x2 + w2 && x2 < x + w) {
    if (y < y2 + h2 && y2 < y + h) {
      return true;
    }
  }
  return false;
}

function checkBorders(x, y) {
  if (x < 0) return true;
  if (y < 0) return true;
  if (x > MAPWIDTH - PSIZE) return true;
  if (y > MAPHEIGHT - PSIZE) return true;
}

function render() {
  player.spr.position.x = playerX;
  player.spr.position.y = playerY;
}

function getParameterByName(name) {
  name = name.replace(/[\[]/, '\\\[').replace(/[\]]/, '\\\]');
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(location.search);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

var inputs = [];
window.addEventListener('keydown', function (e) {
  inputs[e.keyCode] = true;
});

window.addEventListener('keyup', function (e) {
  inputs[e.keyCode] = false;
});

loadContent();
