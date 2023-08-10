

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
//const helmet = require('helmet');
const morgan = require('morgan');

var readvalue = null;

var redisSettings = {}
redisSettings.adress = process.env.REDIS_ADRESS
redisSettings.password = process.env.REDIS_PASSWORD
var options = {
  url: "redis://:" + redisSettings.password + "@" + redisSettings.adress
}


var clientId = "lekern"

var redis = require("redis"),
  client = redis.createClient(options);



client.on("error", function (err) {
  console.log("Error " + err);
});

Object.assign = require('object-assign')

// adding Helmet to enhance your Rest API's security
//app.use(helmet());

// using bodyParser to parse JSON bodies into JS objects
app.use(bodyParser.json());

// enabling CORS for all requests
app.use(cors());

// adding morgan to log HTTP requests
app.use(morgan('combined'));

app.engine('html', require('ejs').renderFile);
app.use(express.static('public'));

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 8080,
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0',
  mongoURL = process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL,
  mongoURLLabel = "";

if (mongoURL == null && process.env.DATABASE_SERVICE_NAME) {
  var mongoServiceName = process.env.DATABASE_SERVICE_NAME.toUpperCase(),
    mongoHost = process.env[mongoServiceName + '_SERVICE_HOST'],
    mongoPort = process.env[mongoServiceName + '_SERVICE_PORT'],
    mongoDatabase = process.env[mongoServiceName + '_DATABASE'],
    mongoPassword = process.env[mongoServiceName + '_PASSWORD']
  mongoUser = process.env[mongoServiceName + '_USER'];

  if (mongoHost && mongoPort && mongoDatabase) {
    mongoURLLabel = mongoURL = 'mongodb://';
    if (mongoUser && mongoPassword) {
      mongoURL += mongoUser + ':' + mongoPassword + '@';
    }
    // Provide UI label that excludes user id and pw
    mongoURLLabel += mongoHost + ':' + mongoPort + '/' + mongoDatabase;
    mongoURL += mongoHost + ':' + mongoPort + '/' + mongoDatabase;

  }
}
var db = null,
  dbDetails = new Object();

var initDb = function (callback) {
  if (mongoURL == null) return;

  var mongodb = require('mongodb');
  if (mongodb == null) return;

  mongodb.connect(mongoURL, function (err, conn) {
    if (err) {
      callback(err);
      return;
    }

    db = conn;
    dbDetails.databaseName = db.databaseName;
    dbDetails.url = mongoURLLabel;
    dbDetails.type = 'MongoDB';

    console.log('Connected to MongoDB at: %s', mongoURL);
  });
};

app.post('/temperature', (req, res) => {
  readvalue = req.body;
  console.log("read value");
  console.log(readvalue);
  client.set(clientId, readvalue);
  res.sendStatus(200);
})

app.get('/', function (req, res) {


  client.get(clientId, function (err, rvalue) {
    if (rvalue != null) {
      var data = JSON.parse(rvalue);
      console.log(data);
      res.render('panelKernel.html', { temp: data.temp, lastread: data.lastupdate, ippublic: data.ippublic });


    }
    else {
      res.render('panelKernel.html', { temp: "error", lastread: "now" });
    }
  })



});



// error handling
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});

initDb(function (err) {
  console.log('Error connecting to Mongo. Message:\n' + err);
});

app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
