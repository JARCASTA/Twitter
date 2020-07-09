'use strict'

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    role: String,
    followers:[{type: Schema.Types.ObjectId, ref:'user'}],
    following:[{type: Schema.Types.ObjectId, ref:'user'}],
    tweets:[{type: Schema.Types.ObjectId, ref:'tweet'}]
})

module.exports = mongoose.model('user', userSchema);