var express = require('express')
var router = express.Router()

var Git = require("nodegit")
var exec = require('child_process').exec
var util = require('util')
var fs = require('fs')

var Repositories = require('../config/db').get('repositories')

router.post('/:name/:repo', function(req, res) {
  var setting = req.params.name + '/' + req.params.repo
  var repo = Repositories.find(function(value, key) {
    if (key === setting) return true
  }).value()

  if(!repo) {
    return res.sendStatus(404)
  }

  openRepo(repo).then(function() {
    return pushToDrupal(repo)
  }).then(function() {
    res.sendStatus(200)
  }).catch(function(error) {
    console.log(error)
    res.status(500).send(error)
  })

})

function openRepo(repo) {
  return new Promise(function(resolve, reject) {
    Git.Repository.open(repo.path).then(function(successfulResult) {
        fetchUpdates(repo, function(err) {
          if (err) return reject(err)
          resolve()
        })
      },
      function(reasonForFailure) {
        console.error(reasonForFailure)
        if(/Failed to resolve path/.test(reasonForFailure) || /Could not find repository/.test(reasonForFailure)) {
          cloneRepo(repo, function(err) {
            if(err) return reject(err)
            resolve()
          })
        }
        else {
          reject(reasonForFailure)
        }
      })
  })
}

function cloneRepo(repo, cb) {
  console.log('cloning repository...')
  var cmd = util.format('git clone --mirror %s %s', repo.github, repo.path)
  executeCmd(cmd, function(err) {
    if (err) return cb(err)
    console.log('cloning finished')
    cb()
  })
}

function fetchUpdates(repo, cb) {
  console.log('fetching updates...')
  var cmd = util.format('git -C %s fetch', repo.path)
  executeCmd(cmd, function(err) {
    if (err) return rb(err)
    console.log('fetching finished')
    cb();
  })
}

function pushToDrupal(repo) {
  return new Promise(function(resolve, reject) {
    console.log('starting push...')
    var cmd = util.format('git -C %s push --tags -f %s %s', repo.path, repo.mirror, repo.branch)
    executeCmd(cmd, function(err) {
      if (err) return reject(err)
      console.log('push finished')
      resolve()
    })
  })
}

function executeCmd(cmd, cb) {
  exec(cmd, function(error, stdout, stderr) {
    if(error) {
      return cb(error)
    }
    console.log(stdout)
    console.error(stderr)
    cb()
  })
}

router.get('/', function(req, res) {
  res.send('Github Mirror Test')
})

module.exports = router