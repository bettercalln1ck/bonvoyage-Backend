const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
    comment:  {
        type: String,
        required: true
    },
    author:  {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

var Messages = mongoose.model('Message', messageSchema);

module.exports = Messages;