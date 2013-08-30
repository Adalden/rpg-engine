/* jshint node:true */
var request = require('request'),
      couch = require('config').couch,
          _ = require('underscore');

var couchUrl = 'http://' + couch.host + ':' + couch.port + '/' + couch.db.maps;

module.exports = function (app) {
  'use strict';

  app.get('/maps/all', getMaps);
};

function getMaps(req, res) {
  'use strict';

  getMapsFromCouch(function (err, maps) {
    if (err) {
      console.error(err);
      res.send({
        success: false,
        err: err
      });
      return;
    }

    res.send({
      success: true,
      maps: maps
    });
  });
}

function getMapsFromCouch(cb) {
  'use strict';

  request.get(couchUrl + '/_all_docs?include_docs=true', function (err, resp, body) {
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

    var rows = _.map(body.rows, function (row) {
      return {
        id: row.id,
        name: row.doc.title || 'untitled map',
        author: row.doc.author || 'unknown'
      };
    });

    cb(null, rows);
  });
}
