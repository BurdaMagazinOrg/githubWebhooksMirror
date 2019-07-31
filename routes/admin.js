var express = require('express')
var router = express.Router()
var passport = require('passport')
var settings = require('../settings.json')

var GitHubApi = require('@octokit/rest')
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
  res.redirect(settings.pathPrefix + '/admin/login')
})

router.get('/auth/github', passport.authenticate('github'))

router.get('/auth/callback',
  passport.authenticate('github', { failureRedirect: settings.pathPrefix + '/admin/login', failureFlash: true }),
  function(req, res) {
    res.redirect(settings.pathPrefix + '/admin')
  }
)

router.get('/', isAuthenticated, function(req, res) {
  var github = new GitHubApi(githubSettings)
  github.authenticate({
    type: "token",
    token: req.user.accesstoken
  })

  getAllRepos(github)
  .then(function(data) {

    var repos = Repositories.value()
    res.render('admin', {
      title: "Mirror Admin",
      values: data,
      repos: repos,
      githubRepos: data,
    })
  })
})

async function getAllRepos(github) {
  let finished = false
  let page = 1

  let data = []

  while(!finished) {
    data[page-1] = await github.repos.getAll({per_page: 100, page: page})
    if (data[page-1]['headers']['link'] && !github.hasNextPage(data[page-1]['headers'])) {
      finished = true
    }
    page++
  }

  return data
}

router.post('/', isAuthenticated, function(req, res) {
  if(req.body.repo && req.body.mirror && req.body.branch) {
    var url = 'http://' + req.get('host') + settings.pathPrefix + '/mirror/' + req.body.repo
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
        hook_id: data.data.id,
        github: 'ssh://git@github.com/' + req.body.repo + '.git',
        mirror: req.body.mirror,
        branch: req.body.branch,
        path: './repositories/' + req.body.repo
      }}).value()
      res.redirect(settings.pathPrefix + '/admin')
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
    hook_id: repo.hook_id
  }).then(function(data) {
    var success = Repositories.unset(setting).value()
    if(success) {
      res.redirect(settings.pathPrefix + '/admin')
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
  res.redirect(settings.pathPrefix + '/admin/login')
}
