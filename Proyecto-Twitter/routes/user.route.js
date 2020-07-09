'use strict'

var express = require('express');
var api = express.Router();
var userController = require('../controllers/user.controller');
var mdAuth = require('../middlewares/authenticated');

api.post('/commands', mdAuth.ensureAuth ,userController.commands);

module.exports = api;