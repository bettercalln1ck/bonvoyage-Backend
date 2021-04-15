const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const Merchs = require('../models/merchModel');
const Users = require('../models/userModel')

const merchRouter = express.Router();
var authenticate = require('../authenticate');
const stripe = require("stripe")("sk_test_51IO7TIK1JmW0iRErJG70YmZ68knfrleuuuEJ7tyYEUpTZN15Z1wXRPbmLdDpWlf8TxgUWF9u7m2vqWJ390OzdQM100xY19tz2c");
const shortid = require('shortid');

const Razorpay = require('razorpay')
const razorpay = new Razorpay({
    key_id: 'rzp_test_s6HVQD9M4O67YD',
    key_secret: 'fJ1uvi5d41uNMBobhDJdNWes'
})


merchRouter.use(bodyParser.json());


merchRouter.route('/addMerch')
.options( (req, res) => {res.sendStatus(200); })
.post(authenticate.verifyUser,authenticate.verifySeller, (req, res, next) => {
    if(req.body != null)
    {
        req.body.seller=req.user._id;
        Merchs.create(req.body)
        .then((merch)=>{
            Merchs.findById(merch._id)
            .populate('seller')
            .then((merch) =>{
 //           merch.seller=req.user._id;
            res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success:true,merch});
            })
        })
    }else{
        err = new Error('Merch info not found in request body');
        err.status = 404;
        return next(err);
    }
})
.put( authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /addMerch');
})
.delete( authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
	res.statusCode = 403;
    res.end('PUT operation not supported on /addMerch');	        
});

const calculateOrderAmount = items => {
    // Replace this constant with a calculation of the order's amount
    // Calculate the order total on the server to prevent
    // people from directly manipulating the amount on the client
    return 1400;
  };


/*merchRouter.post('/orders', async (req, res) => {
    const options = {
        amount: req.body.amount,
        currency: 'INR',
        receipt: shortid.generate(), //any unique id
        payment_capture = 1 //optional
    }
    try {
        const response = await razorpay.orders.create(options)
        res.json({
            order_id: response.id,
            currency: response.currency,
            amount: response.amount
        })
    } catch (error) {
        console.log(error);
        res.status(400).send('Unable to create order');
    }
})
  
merchRouter.post("/create-payment-intent", async (req, res) => {
    const { items } = req.body;
    // Create a PaymentIntent with the order amount and currency
    paymentIntent = await stripe.paymentIntents.create({
        amount: 1099,
        currency: 'usd',
        description: 'Software development services',
      });

     customer = await stripe.customers.create({
        name: 'Jenny Rosen',
        address: {
          line1: '510 Townsend St',
          postal_code: '98140',
          city: 'San Francisco',
          state: 'CA',
          country: 'US',
        }
      });

    res.send({
      clientSecret: paymentIntent.client_secret
    });
  });
  
*/

merchRouter.route('/:merchId')
.options( (req, res) => {res.sendStatus(200); })
.get(authenticate.verifyUser,(req,res,next)=>{
    Merchs.findById(req.params.merchId)
    .populate('seller')
    .then((merch) =>{
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json({success:true,merch});
    },(err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser,(req,res,next) => {
    req.statusCode=403;
    res.end('POST operation not supported ');
})
.put(authenticate.verifyUser,authenticate.verifySeller,(req,res,next)=>{
    Merchs.findById(req.params.merchId)
    .populate('seller')
    .then((merch)=>{
        if(merch!=null){
            if(!merch.seller.equals(req.user._id)){
                var err = new Error('You are not authorized to update this merch info!');
                err.status = 403;
                return next(err);
            }
            Merchs.findByIdAndUpdate(req.params.merchId,{
                $set: req.body
            },{new:true})
            .then((merch)=>{
                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({success:true,merch}); 
            })
        }else{
            err= new Error('Merch' +req.params.merchId +'not found');
            err.status =404;
            return next(err);
        }
    }
    ,(err) => next(err))
    .catch((err) =>next(err));
})
.delete(authenticate.verifyUser,authenticate.verifySeller, (req,res,next) => {
    Merchs.findById(req.params.merchId)
    .then((merch) => {
        if (merch != null) {
            Merchs.findByIdAndRemove(req.params.merchId)
            .then((resp) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(resp); 
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            err = new Error('Merch ' + req.params.merchId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

merchRouter.route('/:merchId/addVarients')
.options( (req, res) => {res.sendStatus(200); })
.post(authenticate.verifyUser,authenticate.verifySeller,(req,res,next)=>{
    Merchs.findByIdAndUpdate(req.params.merchId,{
        $push:{'category.variants': req.body} 
    },{new:true},function(err,result){
         if(err){
             res.send(err);
         }
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json({success:true,result});
    },(err) => next(err))
    .catch((err) => next(err));
});

merchRouter.route('/:merchId/cart')
.options( (req, res) => {res.sendStatus(200); })
.get(authenticate.verifyUser,(req,res,next)=>{
    Users.findById(req.params._id)
    .then((user) =>{
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json({success:true,cart:user.cart});
    },(err) => next(err))
    .catch((err) => next(err));
})
.post(authenticate.verifyUser,(req,res,next)=>{
Merchs.findById(req.params.merchId)
    .then((merch) =>{
        Users.findByIdAndUpdate(req.user._id,{
            $push:{cart:{'color':req.body.color,'size':req.body.size,'units':req.body.unitsInStock,'merch':req.params.merchId}
        }},{new:true},function(err,user){
            if(err){
                res.send(err);
            }
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json({sucpicturescess:true,user});
        });
        
    },(err) => next(err))
    .catch((err) => next(err));

});



/*merchRouter.route('/:merchId/buy')
.options( (req, res) => {res.sendStatus(200); })
.post(authenticate.verifyUser,(req,res,next)=>{
Merchs.findOneAndUpdate({_id:req.params.merchId,'category.variants':{$elemMatch:{
    "color":req.body.color,"size":req.body.size   
}}},{
    $inc:{'category.variants.$.unitsInStock':req.body.unitsInStock}
},{new:true},function(err,result){
         if(err){
             res.send(err);
         }
        Users.findByIdAndUpdate(req.user._id,{
            $push:{pastOrders:{'color':req.body.color,'size':req.body.size,'units':-1*req.body.unitsInStock,'merch':result}
        }},{new:true},function(err,user){
            if(err){
                res.send(err);
            }
        });
        res.statusCode=200;
        res.setHeader('Content-Type','application/json');
        res.json({success:true,result});
    },(err) => next(err))
    .catch((err) => next(err));

});*/

merchRouter.route('/:merchId/review')
.options((req, res) => { res.sendStatus(200); })
.post(authenticate.verifyUser, (req,res,next) => {
    if(req.body != null){
        req.body.author = req.user._id;
        req.body.post = req.params.postId;
        Merchs.findByIdAndUpdate(req.params.merchId,{
            $push:{'review': req.body} 
        },{new:true},function(err,result){
             if(err){
                 res.send(err);
             }
            res.statusCode=200;
            res.setHeader('Content-Type','application/json');
            res.json({success:true,result});
        },(err) => next(err))
        .catch((err) => next(err));
    }
    else{
        err = new Error('Review not found in request body');
        err.status = 404;
        return next(err);
    }
})
.put( authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported ');
})
.delete(authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('DELETE operation not supported ');
});

merchRouter.route('/:merchId/review/:ratingId')
.options((req, res) => { res.sendStatus(200); })
.get(authenticate.verifyUser, (req,res,next) => {
    Merchs.findOne({_id:req.params.merchId,'review._id':req.params.ratingId})
    .populate({
        path: 'review',
        populate:{path:'author'}
    })
    .then((rating) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json({success:true, rating})
    },(err) => next(err))
    .catch((err) => next(err));
})
.post( authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('POST operation not supported on '+ req.params.merchId);
})
.put(authenticate.verifyUser, (req, res, next) => {
    Merchs.findById(req.params.merchId)
    .then((merch) => {
        if(merch != null){
            if(!comment.author.equals(req.user._id)){
                var err = new Error('You are not authorized to update this comment!');
                err.status = 403;
                return next(err);
            }
            req.body.author = req.user._id;
            Comments.findByIdAndUpdate(req.params.commentId, {
                $set: req.body
            }, {new : true})
            .then((comment) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success:true})
            }, (err) => next(err));
        }
        else {
            err = new Error('Comment ' + req.params.commentId + ' not found!');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.delete( authenticate.verifyUser, (req, res, next) => {
    Comments.findById(req.params.commentId)
    .then((comment) => {
        if(comment != null){
            if(!comment.author.equals(req.user._id)){
                var err = new Error('You are not authorized to delete this post!');
                err.status = 403;
                return next(err);
            }
            Posts.findByIdAndUpdate(req.params.postId, {
                $pull: {comments: req.params.commentId},
                $inc: {commentcount: -1}
            }, {new:true}, function(err, result) {
                if(err){
                    res.send(err);
                }
            });
            Comments.findByIdAndRemove(req.params.commentId)
            .then((comment) => {
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json({success:true})
            }, (err) => next(err))
        }
        else{
            err = new Error('Comment ' + req.params.commentId + ' not found!');
            err.status = 404;
            return next(err); 
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});



module.exports=merchRouter;
