const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const splitWiseSchema = new Schema({
    expended:  {
        type: Number,
        required: true
    },
    author:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

var splitWise = mongoose.model('SplitWise', splitWiseSchema);

module.exports = splitWise;