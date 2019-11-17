const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/user', {useNewUrlParser: true,useUnifiedTopology: true});
const User = require('./models/user');

// invoke an instance of express application.
var app = express();

// set our application port
app.set('port', 9000);

// set morgan to log info about our requests for development use.
app.use(morgan('dev'));

// initialize body-parser to parse incoming parameters requests to req.body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(cors());

app.use("/admin", require("./Router/AdminRoute"));
app.use("/user", require("./Router/UserRoute"));

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find this endpoint")
});

// start the express server
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`) );