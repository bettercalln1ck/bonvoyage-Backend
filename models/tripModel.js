var mongoose=require('mongoose');
var Schema=mongoose.Schema;


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
        }]       
}, {
    timestamps: true
});

var Places = mongoose.model('Trips', tripSchema);

module.exports = Places;