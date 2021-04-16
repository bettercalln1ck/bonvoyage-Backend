var mongoose=require('mongoose');
var Schema=mongoose.Schema;

var rows =new Schema({
    columns:[{
        type:Number,
    }]
})


var matrix = new Schema({
    rows: [rows]
})

const tripSchema = new Schema({
        cityName :{
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
        temporalGraph:[
            matrix
        ],
        score : [{
            type: Number,
        }],
        timeToVisit : [{
            type: Number,
        }],
        preferredTime:[{
            x :{
                type: Number,
            },
            y:{
                type: Number,
            }
        }],
        openTime:[{
            x :{
                type: Number,
            },
            y:{
                type: Number,
            }
        }],
        placeId:[{
            type:String
        }]       
}, {
    timestamps: true
});

var Places = mongoose.model('Trips', tripSchema);

module.exports = Places;