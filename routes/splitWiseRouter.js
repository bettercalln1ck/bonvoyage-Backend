const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const splitWiseRouter = express.Router();

const Trips = require('../models/tripModel');
const Users = require('../models/user'); 
const SplitWise = require('../models/splitWiseModel');

splitWiseRouter.use(bodyParser.json());

splitWiseRouter.route('/:tripId')
.options( (req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, async (req,res,next) => {
    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || !user.trips.indexOf(req.params.tripId) )
        {
            res.json("Join this trip to view splitwise");
            return;
        }
    },(err) => next(err))
    .catch((err) => next(err));

    await Trips.findById(req.params.tripId)
    .populate({
        path: 'splitWise',
        select:{"expended":1,"_id":1}
    // populate:{
    //     path:'author',
    //     model:'User',
    //     select :{"username":1,"_id":1}
    // }
    })
    .then((trip) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:true, SplitWise : trip.splitWise})
    },(err) => next(err))
    .catch((err) => next(err));
})
.post( authenticate.verifyUser, async (req,res,next) => {
    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || !user.trips.indexOf(req.params.tripId) )
        {
            res.json("Join this trip to send message");
            return;
        }
    },(err) => next(err))
    .catch((err) => next(err));

    if(req.body != null){
        req.body.author = req.user._id;
        SplitWise.create(req.body)
        .then(async(splitwise) => {
            await Trips.findByIdAndUpdate(req.params.tripId, {
                $push: {splitWise: splitwise._id}
            }, {new:true}, function(err, result){
                if(err){
                    res.send(err);
                }
            });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success:true,splitwise});
        }, (err) => next(err))
        .catch((err) => next(err));
    }
    else{
        err = new Error('Comment not found in request body');
        err.status = 404;
        return next(err);
    }
})
.put( authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /comments/:postId');
});

splitWiseRouter.route('/calculate/:tripId')
.options( (req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, async (req,res,next) => {
    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || !user.trips.indexOf(req.params.tripId) )
        {
            res.json("Join this trip to view splitwise");
            return;
        }
    },(err) => next(err))
    .catch((err) => next(err));

    await Trips.findById(req.params.tripId)
    .populate({
        path: 'splitWise',
        select:{"expended":1,"_id":1},
    populate:{
        path:'author',
        model:'User',
        select :{"username":1,"_id":1}
    },})
    .then(async (trip) => {
        let expenseMap = new Map();
        for(var i = 0;i<trip.SplitWise.length();i++){
            expenseMap[trip.SplitWise[i].author._id] = {name:trip.SplitWise[i].author.username,expense: expenseMap[trip.SplitWise[i].author._id].expense+trip.SplitWise[i].expended};
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:true, SplitWise : expenseMap})
    },(err) => next(err))
    .catch((err) => next(err));
})

module.exports = splitWiseRouter;