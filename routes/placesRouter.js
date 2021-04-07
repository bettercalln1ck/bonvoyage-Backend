var express = require('express');
const bodyParser=require('body-parser');
var User=require('../models/user');
var placesRouter = express.Router();
var passport=require('passport');
var authenticate=require('../authenticate');
var uniqueValidator = require('mongoose-unique-validator');
const axios = require('axios');


placesRouter.route('/')
.get(authenticate.verifyUser,(req, res, next)=> {
  src = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+Sydney&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"
axios.get(src)
  .then(response => {
    console.log(response.data);
    res.json(response.data);
  })
  .catch(error => {
    console.log(error);
  });

});

module.exports = placesRouter;

