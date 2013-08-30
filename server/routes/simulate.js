/* jshint node:true, strict:false */
var request = require('request'),
      couch = require('config').couch,
    gameUrl = require('config').gameUrl,
     tokens = require('config').tokens;

module.exports = function (app) {
  app.post('/uploadMap/:token', saveMap);
  app.get('/map/:id', getMap);
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

  getMapFromCouch(id, function (err, map) {
    if (err) {
      console.error(err);
      res.send({
        success: false,
        err: err
      });
      return;
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

// -+-+ Private Functions +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-

function validate(map) {
  if (!map) {
    return 'You didn\'t post in the format: { map: YOURMAP }.';
  }

  if (!map.data) {
    return 'Your map didn\'t contain a data property.';
  }

  if (typeof map.data !== 'object') {
    return 'map.data should be an object.';
  }

  if (!map.data.bottom) {
    return 'Your map\'s data didn\'t contain a bottom property.';
  }

  // verify the contents of map.data.bottom

  return false;
}

function genReport(map) {
  var report = '';

  if (!map.title) {
    report += '<p>Your map doesn\'t have a title. Might be nice if you need to display stuff to a user.</p>';
  }
  else if (typeof map.title !== 'string') {
    report += '<p>map.title should be a string.</p>';
  }

  if (!map.author) {
    report += '<p>Your map doesn\'t have a author. Might be nice if you need to display stuff to a user.</p>';
  }
  else if (typeof map.author !== 'string') {
    report += '<p>map.author should be a string.</p>';
  }

  if (!map.width) {
    report += '<p>Your Map doesn\'t have a width. Not really important in Javascript, but it helps in other inferior languages ;).</p>';
  }
  else if (typeof map.width !== 'number') {
    report += '<p>map.width should be a number.</p>';
  }

  if (!map.height) {
    report += '<p>Your Map doesn\'t have a height. Not really important in Javascript, but it helps in other inferior languages ;).</p>';
  }
  else if (typeof map.height !== 'number') {
    report += '<p>map.height should be a number.</p>';
  }

  if (!map.env) {
    report += '<p>Your Map doesn\'t have an env. Assuming Normal.</p>';
  }
  else if (typeof map.env !== 'string') {
    report += '<p>map.env should be a string.</p>';
  }

  if (!map.events) {
    report += '<p>Your Map doesn\'t have an events array. None will be loaded.</p>';
  }

  // verify the inside of events

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

function getMapFromCouch(id, cb) {
  request.get(couchUrl + '/' + id, function (err, resp, body) {
    if (err) {
      return cb(err);
    }
    if (!body) {
      return cb('body not found');
    }

    body = JSON.parse(body);

    if (body.error) {
      return cb(body);
    }

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
