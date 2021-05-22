const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const splitWiseRouter = express.Router();

var Trips = require('../models/tripModel');
const Users = require('../models/user'); 
const SplitWise = require('../models/splitWiseModel');

splitWiseRouter.use(bodyParser.json());

splitWiseRouter.route('/calculate/:tripId')
.options( (req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, async (req,res,next) => {
    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || user.trips.indexOf(req.params.tripId) === -1 )
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
       // console.log(trip.splitWise)
        let expenseMap = new Map();
        var toPay = []
        var averageExpense  = 0;
        await trip.splitWise.forEach((element)=>{
            expense = 0;
            averageExpense += element.expended;
            if(typeof expenseMap.get(element.author._id) !== "undefined"){
                expense =expenseMap.get(element.author._id).expense+element.expended;
            }else{
                expense = element.expended;
            }
            expenseMap.set(element.author._id,{name:element.author.username,expense: expense});
        });

        averageExpense = averageExpense/(expenseMap.size);
        await expenseMap.forEach((values,keys) =>{
            toPay.push({
                "_id":keys,
                "username":values.name,
                "toPay": (averageExpense-values.expense).toFixed(2),
            })
        })

        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:true, splitWise : toPay})
    },(err) => next(err))
    .catch((err) => next(err));
});


splitWiseRouter.route('/:tripId')
.options( (req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, async (req,res,next) => {
    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || user.trips.indexOf(req.params.tripId) === -1 )
        {
            res.json("Join this trip to view splitwise");
            return;
        }
    },(err) => next(err))
    .catch((err) => next(err));

    await Trips.findById(req.params.tripId)
    .populate({
        path: 'splitWise',
        select:{"expended":1,"_id":1,"updatedAt":1},
     populate:{
         path:'author',
         model:'User',
         select :{"username":1,"_id":1}
     }
    },)
    .then((trip) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:true, splitWise : trip.splitWise})
    },(err) => next(err))
    .catch((err) => next(err));
})
.post( authenticate.verifyUser, async (req,res,next) => {
    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || user.trips.indexOf(req.params.tripId) === -1 )
        {
            res.json("Join this trip to register expenses");
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
            }).then((resp) => console.log(resp));
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



module.exports = splitWiseRouter;