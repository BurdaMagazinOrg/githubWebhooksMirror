/**
 * Created by timowelde on 29.03.16.
 */
var async = require('async')
var express = require('express')
var morgan = require('morgan')
var bodyParser = require("body-parser")
var Git = require("nodegit")
var util = require('util')
var exec = require('child_process').exec
var fs = require('fs')

try {
  var settings = require('./settings.json')
  if(!settings.localPath || !settings.githubUrl || !settings.drupalUrl) {
    throw new Error()
  }
} catch (e) {
  console.log('You have to provide a valid settings.json')
  process.exit(1)
}

var jsonencode = bodyParser.json()

var app = express()

app.use(morgan('dev'))

//router.use(express.static(path.resolve(__dirname, 'client')))

app.post('/', jsonencode, function(req, res) {
  //console.log(req.body)
  Git.Repository.open(settings.localPath).then(function(successfulResult) {
      successfulResult.fetchAll({}, function() {
        pushToDrupal(successfulResult)
      })
    },
    function(reasonForFailure) {
      console.log(reasonForFailure)
      if(/Failed to resolve path/.test(reasonForFailure) || /Could not find repository/.test(reasonForFailure)) {
        cloneRepo()
      }
    })

  res.sendStatus(200)
})

function cloneRepo() {
  console.log('cloning repository...')
  var cmd = util.format('git clone --mirror %s %s', settings.githubUrl, settings.localPath)
  exec(cmd, function (error, stdout, stderr) {
    if(error) {
      throw error
    }
    console.log(stdout)
    console.log(stderr)
    console.log('cloning finished')
    pushToDrupal()
  })
}

function pushToDrupal() {
  console.log('starting push...')
  var cmd = util.format('git -C %s push --mirror %s', settings.localPath, settings.drupalUrl)
  exec(cmd, function(error, stdout, stderr) {
    if(error) {
      console.error(error)
    }
    console.log(stdout)
    console.error(stderr)
    console.log('push finished')
  })
}

app.get('/', function(req, res) {
  res.send('Github Mirror Test')
})

var listener = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = listener.address()
  console.log("Mirror server listening at", addr.address + ":" + addr.port)
})
