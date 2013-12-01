/* global PIXI, $, requestAnimationFrame, _, Q */
'use strict';

window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function (cb) { setTimeout(cb, 1000 / 60); };

var ALLMAPS = {};

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
var upLyr;
var player = { bottom: true, left: true, right: true, top: true };
var curDir;

function resetMap(id, x, y) {
  if (id !== undefined) {
    stage.removeChild(dMap);
    if (upLyr) stage.removeChild(upLyr);
    upLyr = undefined;

    map = ALLMAPS[id];
    createGameBoard();
  }

  playerX = x * SIZE;
  playerY = y * SIZE;
}

function loadContent() {
  var assets = ['img/bottom.png', 'img/middle.png', '/img/top.png', '/img/player.png'];
  var loader = new PIXI.AssetLoader(assets);
  loader.onComplete = function () {
    loadMapTextures();
    loadPlayerTextures();
    loadMaps(function (err, aMap) {
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

function loadMaps(cb) {
  var id = getParameterByName('id');
  if (!id) return cb('No ID was given.');

  _loadMap(id).then(function (aMap) {
    cb(null, aMap);
  }, function (err) {
    cb(err);
  });
}

function _loadMap(grp, name) {
  var deferred = Q.defer();

  var url = '/map/' + grp;
  if (name) url += '/' + name;

  $.get(url, function (data) {
    if (!data.success) return deferred.reject(data.err);

    var map = data.map;
    ALLMAPS[map.title] = map;

    map.events = map.events || [];
    map.data.middle = map.data.middle || [];

    var promises = [];
    _.each(map.events, function (ev) {
      if (ev.d_id && !ALLMAPS[ev.d_id])
        promises.push(_loadMap(map.group, ev.d_id));
    });

    Q.all(promises).then(function () {
      deferred.resolve(map);
    }, function (err) {
      deferred.reject(err);
    });
  });

  return deferred.promise;
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
    if (key === 'top') upLyr = lyr;
    else dMap.addChild(lyr);
  }

  if (map.events.length) {
    var evLyr = new PIXI.DisplayObjectContainer();
    _.each(map.events, function (ev) {
      ev.id = ev.id.toLowerCase();
      if (!_.isObject(ev)) return;
      if (ev.id === 'door') {
        addEvent(evLyr, 'events-3', ev.x, ev.y, ev);
      } else if (ev.id === 'treasure') {
        addEvent(evLyr, 'events-0', ev.x, ev.y, ev);
      } else if (ev.id === 'bush') {
        addEvent(evLyr, 'events-1', ev.x, ev.y, ev);
      } else if (ev.id === 'hole') {
        addEvent(evLyr, 'events-2', ev.x, ev.y, ev);
      }
    });
    dMap.addChild(evLyr);
  }

  stage.addChildAt(dMap, 0);

  if (upLyr) stage.addChild(upLyr);
  MAPWIDTH = map.data.bottom[0].length * SIZE;
  MAPHEIGHT = map.data.bottom.length * SIZE;
}

function addEvent(lyr, key, x, y, ev) {
  x = x || 0;
  y = y || 0;

  var spr = PIXI.Sprite.fromFrame(key);
  spr.position.x = x * SIZE;
  spr.position.y = y * SIZE;

  if (ev) {
    map.data.middle[y] = map.data.middle[y] || [];
    map.data.middle[y][x] = true;
    if (!_.isNaN(+ev.d_x) || !_.isNaN(+ev.d_y)) {
      map.data.middle[y][x] = {
        id: ev.d_id,
        x: +ev.d_x,
        y: +ev.d_y
      };
    }
  }

  lyr.addChild(spr);
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

  stage.addChildAt(sprite, 1);
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
      if (checkTile(x, y, PSIZE, PSIZE, j * SIZE, i * SIZE, SIZE, SIZE)) {
        if (_.isObject(m)) resetMap(m.id, m.x, m.y);
        return true;
      }
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
  if (MAPWIDTH < WIDTH) {
    var offset = (WIDTH - MAPWIDTH) / 2;
    dMap.position.x = offset;
    upLyr.position.x = offset;
    player.spr.position.x = offset + Math.floor(playerX);
  } else if (MAPWIDTH == WIDTH) {
    dMap.position.x = 0;
    upLyr.position.x = 0;
    player.spr.position.x = Math.floor(playerX);
  } else {
    var midPoint = WIDTH / 2;
    if (playerX < midPoint) {
      dMap.position.x = 0;
      upLyr.position.x = 0;
      player.spr.position.x = Math.floor(playerX);
    } else if (playerX > MAPWIDTH - midPoint) {
      dMap.position.x = WIDTH - MAPWIDTH;
      upLyr.position.x = WIDTH - MAPWIDTH;
      player.spr.position.x = Math.floor(WIDTH + playerX - MAPWIDTH);
    } else {
      dMap.position.x = midPoint - playerX;
      upLyr.position.x = midPoint - playerX;
      player.spr.position.x = midPoint;
    }
  }

  if (MAPHEIGHT < HEIGHT) {
    var offset = (HEIGHT - MAPHEIGHT) / 2;
    dMap.position.y = offset;
    upLyr.position.y = offset;
    player.spr.position.y = offset + Math.floor(playerY);
  } else if (MAPHEIGHT == HEIGHT) {
    dMap.position.y = 0;
    upLyr.position.y = 0;
    player.spr.position.y = Math.floor(playerY);
  } else {
    var midPoint = HEIGHT / 2;
    if (playerY < midPoint) {
      dMap.position.y = 0;
      upLyr.position.y = 0;
      player.spr.position.y = Math.floor(playerY);
    } else if (playerY > MAPHEIGHT - midPoint) {
      dMap.position.y = HEIGHT - MAPHEIGHT;
      upLyr.position.y = HEIGHT - MAPHEIGHT;
      player.spr.position.y = Math.floor(HEIGHT + playerY - MAPHEIGHT);
    } else {
      dMap.position.y = midPoint - playerY;
      upLyr.position.y = midPoint - playerY;
      player.spr.position.y = midPoint;
    }
  }
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
