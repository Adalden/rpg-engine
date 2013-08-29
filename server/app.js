/* jshint node:true, strict:false */
var       fs = require('fs'),
     express = require('express'),
      stylus = require('stylus');

var app = express();
app.set('port', process.env.PORT || 3000);

var sessOptions = {
  key: 'rpg-engine.sid',
  secret: 'put a secret here'
};

app.configure(
  function () {
    app.use(express.favicon());
    app.use(stylus.middleware({
      debug: true,
      src: 'client',
      dest: 'client'
    }));
    app.use(express.static('client'));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    app.use(express.session(sessOptions));
    app.use(app.router);
    app.use(express.errorHandler());
  }
);

fs.readdirSync(__dirname + '/routes').forEach(
  function (file) {
    require('./routes/' + file)(app);
  }
);

app.listen(app.get('port'),
  function () {
    console.log('Express server listening on port ' + app.get('port') + ' in environment ' + app.get('env'));
  }
);
