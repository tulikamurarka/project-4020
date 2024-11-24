const mongoose = require('mongoose');
const {Schema} = mongoose;

const historySchema = new Schema({

    question: String,
    anticipated_Answer: String,
    multipleChoices: [String],
    chatGPT_Response: String, 

});

const History = mongoose.model('History', historySchema, 'History'); 
module.exports = History; 