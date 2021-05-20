const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
var authenticate = require('../authenticate');
const multer = require('multer');
const cors = require('./cors');
const messageRouter = express.Router();

const Trips = require('../models/tripModel');
const Users = require('../models/user'); 
const Messages = require('../models/messageModel');

messageRouter.use(bodyParser.json());

messageRouter.route('/:tripId')
.options( (req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, async (req,res,next) => {
    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || !user.trips.indexOf(req.params.tripId) )
        {
            res.json("Join this trip to view message");
            return;
        }
    },(err) => next(err))
    .catch((err) => next(err));

    await Trips.findById(req.params.tripId)
    .populate({
        path: 'messages',
        select:{"message":1,"_id":1},
    populate:{
        path:'author',
        model:'User',
        select :{"username":1,"_id":1}
    },})
    .then((trip) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:true, messages : trip.messages})
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
        Messages.create(req.body)
        .then((message) => {
            Trips.findByIdAndUpdate(req.params.tripId, {
                $push: {messages: message._id}
            }, {new:true}, function(err, result){
                if(err){
                    res.send(err);
                }
            });
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json({success:true});
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
    res.end('PUT operation not supported on /messages/:tripId');
});
// .delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
//     Trips.findById(req.params.tripId)
//     .then((trip) => {
//         if(trip != null){
//             // if(!trip.author.equals(req.user._id)){
//             //     var err = new Error('You are not authorized to delete these comments!');
//             //     err.status = 403;
//             //     return next(err);
//             // }
//             Comments.remove({'post' : req.params.postId})
//             .then((resp) => {
//                 Posts.findByIdAndUpdate(req.params.postId, {
//                     $set: {comments : [ ]},
//                     $set: {commentcount : 0}
//                 }, {new:true}, function(err, result){
//                     if(err){
//                         res.send(err);
//                     }
//                 });
//                 res.statusCode = 200;
//                 res.setHeader('Content-Type', 'application/json');
//                 res.json({success:true})
//             }, (err) => next(err))
//             .catch((err) => next(err));
//         }
//         else{
//             err = new Error('Post '+ req.params.postId + ' not found!');
//             err.status = 404;
//             return next(err);
//         }
//     }, (err) => next(err))
//     .catch((err) => next(err));
// });

messageRouter.route('/:tripId/:messageId')
.options( (req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, async(req,res,next) => {

    await Users.findById(req.user._id)
    .then((user)=>{
        if(typeof user.trips === "undefined" || !user.trips.indexOf(req.params.tripId) )
        {
            res.json("Join this trip to view message");
            return;
        }
    },(err) => next(err))
    .catch((err) => next(err));

    await Messages.findById(req.params.messageId)
    .then((message) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:true, message})
    },(err) => next(err))
    .catch((err) => next(err));
})
.post( authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on /messages/:messsageId/'+ req.params.commentId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    Messages.findById(req.params.messageId)
    .then((message) => {
        if(message != null){
            if(!message.author.equals(req.user._id)){
                var err = new Error('You are not authorized to update this message!');
                err.status = 403;
                return next(err);
            }
            req.body.author = req.user._id;
            Messages.findByIdAndUpdate(req.params.messageId, {
                $set: req.body
            }, {new : true})
            .then((message) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success:true,message:message})
            }, (err) => next(err));
        }
        else {
            err = new Error('Message ' + req.params.messageId + ' not found!');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete( authenticate.verifyUser, (req, res, next) => {
    Messages.findById(req.params.messageId)
    .then((message) => {
        if(message != null){
            if(!message.author.equals(req.user._id)){
                var err = new Error('You are not authorized to delete this message!');
                err.status = 403;
                return next(err);
            }
            Trips.findByIdAndUpdate(req.params.postId, {
                $pull: {messages: req.params.messageId},
            }, {new:true}, function(err, result) {
                if(err){
                    res.send(err);
                }
            });
            Message.findByIdAndRemove(req.params.messageId)
            .then((message) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success:true})
            }, (err) => next(err))
        }
        else{
            err = new Error('Message ' + req.params.messageId + ' not found!');
            err.status = 404;
            return next(err); 
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

module.exports = messageRouter;