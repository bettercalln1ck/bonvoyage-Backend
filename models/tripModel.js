var mongoose=require('mongoose');
var Schema=mongoose.Schema;

const pathSchema = new Schema({
    placeId:{
        type: String,
    },
    placeName:{
        type: String,
    },
    placeAddress:{
        type:String,
    }
}, { _id : false });

const resultSchema = new Schema({
    path:[pathSchema],
    score:{
        type: mongoose.Decimal128,
    },
    timeTaken:{
        type: mongoose.Decimal128,
    }
}, { _id : false });


const tripSchema = new Schema({
        tripName :{
            type: String,
        },
        start :{
            type: String,
            required: true
        },
        end :{
            type: String,
            required: true
        },
        date:{
            type: String,
            required: true
        },
        placeId:[{
            type:String
        }],
        messages:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message'
        }],
        splitWise:[{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SplitWise'
        }],
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        users: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        result:[resultSchema]       
}, {
    timestamps: true
});

tripSchema.index({'tripName':'text'});

var Places = mongoose.model('Trips', tripSchema);

module.exports = Places;