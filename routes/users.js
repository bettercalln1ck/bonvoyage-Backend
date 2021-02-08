var express = require('express');
const bodyParser=require('body-parser');
var User=require('../models/user');
var router = express.Router();
var passport=require('passport');
var authenticate=require('../authenticate');
var uniqueValidator = require('mongoose-unique-validator');
const cors = require('./cors');

router.route('/verifyToken')
.get(cors.corsWithOptions,authenticate.verifyUser,(req, res, next)=> {
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
.get(cors.corsWithOptions,authenticate.verifyUser,authenticate.verifyAdmin,(req, res, next)=> {
  User.find({})
	.then((user) =>{
	res.statusCode=200;
	res.setHeader('Content-Type','application/json');
	res.json(user);
	},(err) =>next(err))
	.catch((err) => next(err));
});

router.route('/profile/:userId')
.get(cors.corsWithOptions,authenticate.verifyUser,(req, res, next)=> {
  User.findById(req.params.userId)
  .then((user) =>{
      res.statusCode=200;
      res.setHeader('Content-Type', 'application/json');
  //    if(user.followers.includes(req.user._id)){
        res.json({success: true,userId:user._id,username:user.username,firstname: user.firstname,lastname: user.lastname});
 //     }
 //     else{
 //       res.json({success: true,userId:user._id,username:user.username,firstname: user.firstname,lastname: user.lastname});
 //     }
  },(err) => next(err))
    .catch((err) =>next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req,res,next) => {
    User.findById(req.params.userId)
    .then((user) => {
        if (user != null) {
            if (!user._id.equals(req.user._id)) {
                var err = new Error('You are not authorize to edit other people profile!');
                err.status = 403;
                return next(err);
            }
            console.log(req.body);
            User.findByIdAndUpdate(req.params.userId, 
              {$set:req.body

          },{ new: true })
            .then((user) => {
                User.findById(req.params.userId)
                .then((user) => {


                    res.statusCode = 200;
                    res.setHeader('Content-Type', 'application/json');
                    res.json({success:true,user}); 
                })               
            }, (err) => next(err));
        }
        else {
            err = new Error('User ' + req.params.userId + ' not found');
            err.status = 404;
            return next(err);            
        }
    }, (err) => next(err))
    .catch((err) => next(err));
});

router.post('/signup', (req, res, next) => {
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
          res.setHeader('Access-Control-Allow-Origin', '*');

          // Request methods you wish to allow
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
      
          // Request headers you wish to allow
          res.setHeader('Access-Control-Allow-Headers', 'Origin,X-Requested-With,content-type');
      
          // Set to true if you need the website to include cookies in the requests sent
          // to the API (e.g. in case you use sessions)
          res.setHeader('Access-Control-Allow-Credentials', true);
          res.setHeader('Content-Type', 'application/json');
          res.json({success: true,status: 'Registration Successful!'});
        });
      });
    }
  });
});

router.post('/login',cors.corsWithOptions,passport.authenticate('local'),(req,res,next) =>{
			var token=authenticate.getToken({_id:req.user._id});
			res.statusCode=200;		
			res.setHeader('Content-Type','application/json');
			res.json({success: true,userId:req.user._id,token:token,status:'You are successfully login!'});

});


router.get('/logout',cors.corsWithOptions,(req,res) =>{
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

module.exports = router;
