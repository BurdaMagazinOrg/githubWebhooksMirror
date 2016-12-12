var express = require('express')
var router = express.Router()
var passport = require('passport')

var GitHubApi = require('github')
var githubSettings = {}

var db = require('../config/db')
const Repositories = db.get('repositories')

router.get('/login', function(req, res) {
  res.render('admin-login', {
    title: "Mirror Admin Login"
  })
})

router.get('/logout', function(req, res) {
  req.logout()
  res.redirect('/admin/login')
})

router.get('/auth/github', passport.authenticate('github'))

router.get('/auth/callback',
  passport.authenticate('github', { failureRedirect: '/admin/login', failureFlash: true }),
  function(req, res) {
    res.redirect("/admin")
  }
)

router.get('/', isAuthenticated, function(req, res) {
  var github = new GitHubApi(githubSettings)
  github.authenticate({
    type: "token",
    token: req.user.accesstoken
  })

  Promise.all([
    github.repos.getAll({per_page: 100})
  ]).then(function(data) {

    var repos = Repositories.value()

    res.render('admin', {
      title: "Mirror Admin",
      values: data,
      repos: repos,
      githubRepos: data[0],
    })
  })
})

router.post('/', isAuthenticated, function(req, res) {
  if(req.body.repo && req.body.mirror && req.body.branch) {
    var url = 'http://' + req.get('host') + '/mirror/' + req.body.repo
    var github = new GitHubApi(githubSettings)
    github.authenticate({
      type: "token",
      token: req.user.accesstoken
    })
    var body = req.body.repo.split('/')
    var owner = body[0],
        repo = body[1]
    github.repos.createHook({
      owner: owner,
      repo: repo,
      name: 'web',
      config: {
        url: url,
        content_type: 'json',
        // secret: null,
        // insecure_ssl: 0
      },
      events: ['push'],
      active: true
    }).then(function(data) {
      Repositories.assign({[req.body.repo]: {
        webhookID: data.id,
        github: 'https://github.com/' + req.body.repo + '.git',
        mirror: req.body.mirror,
        branch: req.body.branch,
        path: './repositories/' + req.body.repo
      }}).value()
      res.redirect('/admin')
    }).catch(function (err) {
      res.status(500).send(err)
    })
  }
  else {
    res.sendStatus(400)
  }
})

router.get('/remove/:owner/:repo', isAuthenticated, function (req, res) {
  var setting = req.params.owner + '/' + req.params.repo
  var github = new GitHubApi(githubSettings)
  github.authenticate({
    type: "token",
    token: req.user.accesstoken
  })
  var repo = Repositories.get(setting).value()
  github.repos.deleteHook({
    owner: req.params.owner,
    repo: req.params.repo,
    id: repo.webhookID
  }).then(function(data) {
    var success = Repositories.unset(setting).value()
    if(success) {
      res.redirect("/admin")
    }
    else {
      res.sendStatus(500)
    }
  })
  .catch(function(err) {
    res.status('500').send(err)
  })
})

module.exports = router


function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) return next()
  res.redirect('/admin/login')
}