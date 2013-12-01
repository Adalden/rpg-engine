/* jshint node:true, strict:false */
var request = require('request'),
      couch = require('config').couch,
    gameUrl = require('config').gameUrl,
     tokens = require('config').tokens,
          _ = require('underscore');

module.exports = function (app) {
  app.post('/uploadMap/:token', saveMap);
  app.get('/map/:id', getMap);
  app.get('/map/:grp/:name', getMapByGroup);
};

var couchUrl = 'http://' + couch.host + ':' + couch.port + '/' + couch.db.maps;

// -+-+ Public Functions +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

function saveMap(req, res) {
  var token = req.params.token;

  if (!tokens[token]) {
    res.send({
      success: false,
      err: 'Invalid Token!!'
    });
    return;
  }

  var map = req.body.map;

  var err = validate(map);

  if (err) {
    res.send({
      success: false,
      data: JSON.stringify(req.body),
      err: err
    });
    return;
  }

  var report = genReport(map);

  if (report) {
    report = '<div class="error">' + report + '</div>';
  }
  else {
    report = '<div class="success">Congrats. Your map JSON is valid</div>';
  }

  map.created = new Date();
  map.group = tokens[token];
  map.debug = report;

  saveMapToCouch(map, function (err, id) {
    if (err) {
      console.error(err);
      res.send({
        success: false,
        info: 'This was probably a CouchDB error. Tell the TA (dosmun@aggiemail.usu.edu)',
        err: err
      });
      return;
    }

    res.send({
      success: true,
      report: report,
      url: gameUrl + '?id=' + id
    });
  });
}

function getMap(req, res) {
  var id = req.params.id;

  var url = couchUrl + '/' + id;
  getMapFromCouch(url, function (err, map) {
    if (err) {
      console.error(err);
      return res.fail(err);
    }

    map.last_played = new Date();
    map.play_count = map.play_count || 0;
    map.play_count++;

    updateMapInCouch(map);

    delete map._rev;

    res.send({
      success: true,
      map: map
    });
  });
}

function getMapByGroup(req, res) {
  var grp = req.params.grp;
  var name = req.params.name;

  var url = couchUrl + '/_design/_views/_view/byGroupAndName?key=["' + grp + '","' + name + '"]';
  getMapFromCouch(url, function (err, map) {
    console.log(map);
    if (err) {
      console.error(err);
      return res.fail(err);
    }

    if (map.rows.length === 0) return res.fail('map: ' + name + ' does not exist.');

    var newMap = map.rows[0].value; // order it here
    delete newMap._rev;

    res.send({
      success: true,
      map: newMap
    });
  });
}

// -+-+ Private Functions +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

function validate(map) {
  if (!map) {
    return 'You didn\'t post in the format: { map: YOURMAP }.';
  }

  if (!map.data) {
    return 'Your map didn\'t contain a data property.';
  }

  if (!_.isObject(map.data)) {
    return 'map.data should be an object.';
  }

  if (!map.data.bottom) {
    return 'Your map\'s data didn\'t contain a bottom property.';
  }

  if (!_.isArray(map.data.bottom)) {
    return 'map.data.bottom should be an array.';
  }

  if (!map.data.bottom.length) {
    return 'map.data.bottom should have something in it.';
  }

  if (!_.isArray(map.data.bottom[0])) {
    return 'map.data.bottom[0] should be an array at the very least.';
  }

  var err = false;
  _.each(map.data.bottom, function (row, i) {
    if (err) return;

    if (!_.isArray(row)) {
      err = 'map.data.bottom[' + i + '] should be an array';
      return;
    }

    _.each(row, function (cell, j) {
      if (err) return;
      if (cell && !_.isNumber(cell)) {
        if (isNaN(parseInt(cell, 10))) {
          err = 'map.data.bottom[' + i + '][' + j + '] should be a number or null.';
          return;
        }
      }
    });
  });

  return err;
}

function genReport(map) {
  var report = '';

  if (!map.title) {
    report += '<p>Your map doesn\'t have a title. Might be nice if you need to display stuff to a user.</p>';
  }
  else if (!_.isString(map.title)) {
    report += '<p>map.title should be a string.</p>';
  }

  if (!map.author) {
    report += '<p>Your map doesn\'t have a author. Might be nice if you need to display stuff to a user.</p>';
  }
  else if (!_.isString(map.author)) {
    report += '<p>map.author should be a string.</p>';
  }

  if (!map.width) {
    report += '<p>Your Map doesn\'t have a width. Not really important in Javascript, but it helps in other inferior languages ;).</p>';
  }
  else if (!_.isNumber(map.width)) {
    report += '<p>map.width should be a number.</p>';
  }

  if (!map.height) {
    report += '<p>Your Map doesn\'t have a height. Not really important in Javascript, but it helps in other inferior languages ;).</p>';
  }
  else if (!_.isNumber(map.height)) {
    report += '<p>map.height should be a number.</p>';
  }

  if (!map.x) {
    report += '<p>Your Map doesn\'t have an x property. Player will start at column 0.</p>';
  }
  else if (!_.isNumber(map.x)) {
    report += '<p>map.x should be a number.</p>';
  }

  if (!map.y) {
    report += '<p>Your Map doesn\'t have a y property. Player will start at row 0.</p>';
  }
  else if (!_.isNumber(map.y)) {
    report += '<p>map.y should be a number.</p>';
  }

  if (!map.env) {
    report += '<p>Your Map doesn\'t have an env. Assuming Normal.</p>';
  }
  else if (!_.isString(map.env)) {
    report += '<p>map.env should be a string.</p>';
  }

  if (!map.events) {
    report += '<p>Your Map doesn\'t have an events array. None will be loaded.</p>';
  }
  else {
    // verify the inside of events
  }

  // verify data.middle and data.top too

  return report;
}

function saveMapToCouch(map, cb) {
  request.post({
    url: couchUrl,
    json: map
  }, function (err, resp, body) {
    if (err) {
      return cb(err);
    }
    if (!body) {
      return cb('body not found');
    }
    if (!body.ok) {
      return cb(body);
    }

    cb(null, body.id);
  });
}

function getMapFromCouch(url, cb) {
  request.get(url, function (err, resp, body) {
    if (err) return cb(err);
    if (!body) return cb('body not found');

    body = JSON.parse(body);

    if (body.error) return cb(body);

    cb(null, body);
  });
}

function updateMapInCouch(map) {
  request.put({
    url: couchUrl + '/' + map._id,
    json: map
  }, function (err, resp, body) {
    console.error(err);
    console.log(body);
  });
}
