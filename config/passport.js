var passport = require('passport')
var GitHubStrategy = require('passport-github').Strategy

var db = require('./db')
const Users = db.get('users')

passport.use(new GitHubStrategy({
  clientID: 'ae51c7518c5c12b5fb42',
  clientSecret: 'e0179385b5e8613b3b127b2db2beca27306c9102',
  callbackURL: "/admin/auth/callback",
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