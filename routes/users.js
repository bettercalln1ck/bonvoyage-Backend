var express = require('express');
const bodyParser=require('body-parser');
var User=require('../models/user');
var router = express.Router();
var passport=require('passport');
var authenticate=require('../authenticate');
var uniqueValidator = require('mongoose-unique-validator');
//const cors = require('./cors');

router.route('/verifyToken')
.get(authenticate.verifyUser,(req, res, next)=> {
  User.findById(req.user._id)
  .then((user) =>{
  res.statusCode=200;
  res.setHeader('Content-Type','application/json');
  res.json({success: true,userId:user._id,username:user.username,firstname: user.firstname,lastname: user.lastname});
  },(err) =>{
    res.redirect('/logout');
    next(err)})
  .catch((err) => next(err));
});

router.route('/')
.get(authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next)=> {
  User.find({})
	.then((user) =>{
	res.statusCode=200;
	res.setHeader('Content-Type','application/json');
	res.json(user);
	},(err) =>next(err))
	.catch((err) => next(err));
});

router.route('/userTrips')
.get(authenticate.verifyUser,(req, res, next)=> {
  User.findById(req.user._id)
  .populate("trips","placeId tripName start end date")
  .then((user) =>{
    res.statusCode=200;
    res.setHeader('Content-Type', 'application/json');
    
    res.send(user.trips);

//       res.statusCode=200;
//       res.setHeader('Content-Type', 'application/json');
//   //    if(user.followers.includes(req.user._id)){
//         res.json({success: true,userId:user._id,username:user.username,firstname: user.firstname,lastname: user.lastname, bio: user.bio});
//  //     }
//  //     else{
//  //       res.json({success: true,userId:user._id,username:user.username,firstname: user.firstname,lastname: user.lastname});
//  //     }
  },(err) => next(err))
    .catch((err) =>next(err));
})


router.route('/profile')
.get(authenticate.verifyUser,(req, res, next)=> {
  User.findById(req.user._id)
  .then((user) =>{
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
  //    if(user.followers.includes(req.user._id)){
        res.json({success: true,userId:user._id,username:user.username,firstname: user.firstname,lastname: user.lastname, bio: user.bio,trips:user.trips});
 //     }
 //     else{
 //       res.json({success: true,userId:user._id,username:user.username,firstname: user.firstname,lastname: user.lastname});
 //     }
  },(err) => next(err))
    .catch((err) =>next(err));
})
.put( authenticate.verifyUser, (req,res,next) => {
    User.findById(req.user._id)
    .then((user) => {
        if (user != null) {
            if (!user._id.equals(req.user._id)) {
                var err = new Error('You are not authorize to edit other people profile!');
                err.status = 403;
                return next(err);
            }
            console.log(req.body);
            User.findByIdAndUpdate(req.user._id, 
              {$set:req.body

          },{ new: true })
            .then((user) => {
                User.findById(req.user._id)
                .then((user) => {


                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({success:true,user}); 
                })               
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.user._id + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.post('/signup',(req, res, next) => {
  User.register(new User({username: req.body.username}), 
    req.body.password, (err, user) => {
    if(err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.json({err: err});
    }
    else {
      if (req.body.firstname)
        user.firstname = req.body.firstname;
      if (req.body.email)
        user.email = req.body.email;
      if (req.body.lastname)
        user.lastname = req.body.lastname;
      user.save((err, user) => {
        if (err) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.json({err});
          return ;
        }

        passport.authenticate('local')(req, res, () => {
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true,status: 'Registration Successful!'});
        });
      });
    }
  });
});

router.post('/login',(req,res,next) =>{
      passport.authenticate('local')(req,res,() =>{
			var token=authenticate.getToken({_id:req.user._id});
			res.statusCode=200;		
			res.setHeader('Content-Type','application/json');
			res.json({success: true,userId:req.user._id,token:token,status:'You are successfully login!'});
    });
});


router.get('/logout',(req,res) =>{
	if(req.session){
		req.session.destroy();
		res.clearCookie('session-id');
    res.statusCode = 200;
  res.json({success: true,status: 'Successfully log out!'});

	}
	else{
    res.clearCookie('session-id');
		var err =new Error('You are not logged in');
		err.status =403;
		next(err);
	}

});

// router.route('/updateProfile')
// .options((req, res) => { res.sendStatus(200); })
// .put(authenticate.verifyUser, (req, res, next) => {
//   User.findByIdAndUpdate(req.user._id, {
//     $set: req.body
// }, {new: true})
// .then((user) => {
//     res.statusCode = 200;
//     res.setHeader('Content-Type', 'application/json');
//     res.json(user);
// }, (err) => next(err))
// .catch((err) => next(err));
// });

module.exports = router;
