var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var passportLocalMongoose=require('passport-local-mongoose');

var User=new Schema({
	firstName:{
		type:String,
		default:'',
		required: true
	},
	lastName:{
		type:String,
		default:'',
		required: true
	},
	email:{
		type:String,
		default:'',
		required: true
	}
    },
    {
        timestamps: true
});

User.plugin(passportLocalMongoose);

module.exports=mongoose.model('User',User);