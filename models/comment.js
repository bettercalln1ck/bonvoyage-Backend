const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    comment:  {
        type: String,
        required: true
    },
    author:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    merch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Merch'
    }
}, {
    timestamps: true
});

var Comments = mongoose.model('Comment', commentSchema);

module.exports = Comments;