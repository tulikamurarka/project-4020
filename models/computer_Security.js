const { Timestamp } = require("bson");
const mongoose = require('mongoose');
const {Schema} = mongoose;

const computerSecuritySchema = new Schema({

    question: String,
    anticipated_Answer: String,
    multipleChoices: [String],
    chatGPT_Response: String, 

});

const ComputerSecurity = mongoose.model('ComputerSecurity', computerSecuritySchema, 'Computer_Security'); 
module.exports = ComputerSecurity; 