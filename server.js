

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
//const helmet = require('helmet');
const morgan = require('morgan');

var readvalue = null;

var redisSettings = {}
redisSettings.adress = process.env.REDIS_ADRESS;
redisSettings.password = process.env.REDIS_PASSWORD;
redisSettings.internalurl = process.env.REDIS_INTERNALURL;
var options = {
  url: "redis://:" + redisSettings.password + "@" + redisSettings.adress
}

if(redisSettings.internalurl)
{
  options = {
    url: redisSettings.internalurl
  }
  console.log("internal redis");
}


var clientId = "lekern"

var redis = require("redis"),
  client = redis.createClient(options);



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



app.post('/temperature', async (req, res) => {
  readvalue = req.body;
  var hasError = false;

  console.log("read value");
  console.log(readvalue);
  try {
    if (!client.isOpen) {
      await client.connect();
    }
    await client.set(clientId, JSON.stringify(readvalue));

  } catch (error) {
    console.log(error);
    hasError = true;
  }

  if (client.isOpen) {
    await client.quit();
  }

  if (!hasError) {

    res.sendStatus(200);
  }
  else
    res.sendStatus(400);
})

app.get('/', async (req, res) => {

  var hasError = false;
  try {
    if (!client.isOpen) {
      await client.connect();
    }

    var rvalue = await client.get(clientId);
    if (rvalue != null) {
      var data = JSON.parse(rvalue);
      console.log(data);
      res.render('panelKernel.html', { temp: data.temp, lastread: data.lastupdate, ippublic: data.ippublic });


    }
    else {
      res.render('panelKernel.html', { temp: "error", lastread: "now", ippublic: "" });
    }


  } catch (error) {
    console.log(error);
    hasError = true;
    res.render('panelKernel.html', { temp: "error", lastread: "now", ippublic: "" });

  }



  if (client.isOpen )
    await client.quit();

});



// error handling
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something bad happened!');
});


app.listen(port, ip);
console.log('Server running on http://%s:%s', ip, port);

module.exports = app;
