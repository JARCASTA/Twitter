'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var tweetSchema = {
    text:String,
    author: String
}

module.exports = mongoose.model('tweet', tweetSchema)