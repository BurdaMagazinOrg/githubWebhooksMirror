var passport = require('passport')
var GitHubStrategy = require('passport-github').Strategy
var BasicStrategy = require('passport-http').BasicStrategy

var settings = require('../settings.json')

var db = require('./db')
const Users = db.get('users')

passport.use(new BasicStrategy(function (userid, password, done) {
  var user = Users.find({type: "basic", id: userid}).value()
  if (!user) { return done(null, false) }
  if (user.password !== password) { return done(null, false) }
  return done(null, true)
}))

passport.use(new GitHubStrategy({
  clientID: settings.clientID,
  clientSecret: settings.clientSecret,
  callbackURL: settings.pathPrefix + "/admin/auth/callback",
  scope: ['repo', 'write:repo_hook']
}, function(accessToken, refreshToken, profile, cb) {
  var user = Users.find({ id: profile.id})
  if (!user.value()) {
    user = Users.push(profile).last()
  }
  user = user.assign({accesstoken: accessToken}).value()
  return cb(null, user)
}))

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  const user = Users.find({id: id}).value();
  done(null, user);
});

module.exports = passport