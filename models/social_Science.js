const { Timestamp } = require("bson");
const mongoose = require('mongoose');
const {Schema} = mongoose;

const socialScienceSchema = new Schema({

    question: String,
    anticipated_Answer: String,
    multipleChoices: [String],
    chatGPT_Response: String, 

});

const SocialScience = mongoose.model('SocialScience', socialScienceSchema, 'Social_Science'); 
module.exports = SocialScience; 