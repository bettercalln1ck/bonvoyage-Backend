const express=require('express');
const cors=require('cors');
const app=express();

const whitelist=['*'];

var corsOptionsDelegate=(req,callback) =>{
	var corsOptions;
	if(whitelist.indexOf(req.header('Origin')) !== -1)
	{
		corsOptions={credentials: true,origin:true};
	}
	else{
		corsOptions={origin:false};
	}
	callback(null,corsOptions);
};


exports.cors=cors();
//exports.corsWithOptions=cors();
exports.corsWithOptions=cors(corsOptionsDelegate);