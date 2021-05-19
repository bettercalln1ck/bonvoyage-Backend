var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var passportLocalMongoose=require('passport-local-mongoose');

var User=new Schema({
	firstname:{
		type:String,
		default:'',
	},
	lastname:{
		type:String,
		default:'',
	},
	email:{
		type:String,
		default:'',
	},
	dateofbirth: {
		type: String,
		default: ''
	},
	bio: {
		type: String,
		default: ''
	},
	image: {
		type: String,
		default: ''
	},
	trips:[{
		type: mongoose.Schema.Types.ObjectId,
        ref: 'Trips'
	}]
    },
    {
        timestamps: true
});

User.plugin(passportLocalMongoose);

module.exports=mongoose.model('User',User);