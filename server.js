

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
  ip = process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

  

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


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
