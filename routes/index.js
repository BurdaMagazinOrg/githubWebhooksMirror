var express = require('express')
var router = express.Router()
var passport = require('passport')
var Users = require('../config/db').get('users')
var settings = require('../settings.json')

var mirror = require('./mirror')
var admin = require('./admin')

router.get('/', function(req, res) {
  res.redirect(settings.pathPrefix + '/admin')
})

router.use('/mirror', mirror)
router.use('/admin', hasBasicUser, basicAuthentication, admin)

router.get('/newuser', hasNoBasicUser, function(req, res) {
  res.render('newuser')
})
router.post('/newuser', hasNoBasicUser, function(req, res) {
  if(req.body.username && req.body.password){
    var user = Users.push({
      type: "basic",
      id: req.body.username,
      password: req.body.password
    }).value()
    if(user){
      return res.redirect(settings.pathPrefix + '/admin')
    }
    else {
      return res.sendStatus(400)
    }
  }
  else {
    return res.sendStatus(400)
  }
})

module.exports = router

function hasBasicUser(req, res, next) {
  if (Users.find({ type: "basic" }).value()) {
    return next()
  }
  else {
    res.redirect(settings.pathPrefix + '/newuser')
  }
}
function basicAuthentication(req, res, next) {
    let user = req.user
    passport.authenticate('basic', { session: false }).call(this, req, res, function() {
      req.user = user
      next()
    })
}
function hasNoBasicUser(req, res, next) {
  if (Users.find({ type: "basic" }).value()) {
    res.sendStatus(403)
  }
  else {
    next()
  }
}