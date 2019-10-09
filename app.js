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

// route for user signup
app.route('/signup')
    .post((req, res) => {
        User.create(req.body)
        .then(user => {
            res.send(user);
        })
        .catch(error => {
            res.send("creating user error");
        });
    });

app.route('/login')
    .post((req,res) => {
        User.login(req.body)
        .then(user => res.send(user))
        .catch(err => res.send(err));
    });

app.route("/logout")
    .post((req,res) => {
        User.logout(req.body)
        res.send("logged out");
    });

app.route("/user")
    .post((req,res) => {
        User.get(req.body)
            .then((user) => res.send(user))
            .catch((err) => res.send(err) )
    })
    .put((req,res) => {
        User.update(req.body)
            .then((user) => res.send(user))
            .catch((err) => res.send(err) )
    });

// route for handling 404 requests(unavailable routes)
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
});

// start the express server
app.listen(app.get('port'), () => console.log(`App started on port ${app.get('port')}`) );