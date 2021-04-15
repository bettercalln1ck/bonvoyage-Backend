var express = require('express');
const bodyParser=require('body-parser');

var User=require('../models/user');
var Trips = require('../models/tripModel');

var tripsRouter = express.Router();
var passport=require('passport');
var authenticate=require('../authenticate');
var uniqueValidator = require('mongoose-unique-validator');
const axios = require('axios');

//const src = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=restaurants+in+Sydney&key=${process.env.GoogleKey}`

tripsRouter.route('/')
.get(authenticate.verifyUser,(req, res, next)=> {
  src = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=Jaipur&type=tourist_attraction&rankby=prominence&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"
  console.log(src)
axios.get(src)
  .then(response => {
    console.log(response.data);
    res.json(response.data);
  })
  .catch(error => {
    console.log(error);
  });

});

tripsRouter.route('/makeTrip')
.post(authenticate.verifyUser,(req, res, next)=> {
//   src = "https://maps.googleapis.com/maps/api/place/textsearch/json?query=Jaipur&type=tourist_attraction&rankby=prominence&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"
//   console.log(src)
// axios.get(src)
//   .then(response => {
//     console.log(response.data);
//     res.json(response.data);
//   })
//   .catch(error => {
//     console.log(error);
//   });
  Trips.create((req.body))
  .then((trip) =>{
    src = "https://maps.googleapis.com/maps/api/place/textsearch/json?query="+trip.cityName+"&type=tourist_attraction&rankby=prominence&key=AIzaSyArM7cAmAWdHA2I6iL0XLLo979LOyy-920"

    

  }, (err) => next(err))
    .catch((err) => next(err));

});


// tripsRouter.route('/addPlaces')
// .route(authenticate.verify,(req,res,next) =>{

// })

module.exports = tripsRouter;

