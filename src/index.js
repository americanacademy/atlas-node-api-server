var express = require('express');
var app = express();

var mongoose = require ("mongoose");
var config = require('./config');
var setupController = require('./controllers/setup.controller');
var apiController = require('./controllers/api.controller');


var port = process.env.PORT || 3000;

app.use('/assets', express.static(__dirname + '/public'));

mongoose.connect(config.getDbConnectionString());

setupController(app);
apiController(app);

console.log("running on port: " + port);
app.listen(port);