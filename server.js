/**
 * Created by timowelde on 29.03.16.
 */
var express = require('express')
var morgan = require('morgan')
var bodyParser = require("body-parser")
var Git = require("nodegit")
var util = require('util')
var exec = require('child_process').exec
var fs = require('fs')

try {
  var settings = require('./settings.json')
  for(var setting in settings) {
    if(!settings[setting].localPath || !settings[setting].githubUrl || !settings[setting].drupalUrl || !settings[setting].branch) {
      throw new Error()
    }
  }
} catch (e) {
  console.log('You have to provide a valid settings.json')
  process.exit(1)
}

var jsonencode = bodyParser.json()

var app = express()

app.use(morgan('dev'))

//router.use(express.static(path.resolve(__dirname, 'client')))

app.post('/:name', jsonencode, function(req, res) {
  if(!(req.params.name in settings)) {
    return res.sendStatus(404)
  }

  var setting = settings[req.params.name]

  openRepo(setting).then(function() {
    return pushToDrupal(setting)
  }).then(function() {
    res.sendStatus(200)
  }).catch(function(error) {
    console.log(error)
    res.status(500).send(error)
  })

})

function openRepo(setting) {
  return new Promise(function(resolve, reject) {
    Git.Repository.open(setting.localPath).then(function(successfulResult) {
        fetchUpdates(setting, function(err) {
          if (err) return reject(err)
          resolve()
        })
      },
      function(reasonForFailure) {
        console.error(reasonForFailure)
        if(/Failed to resolve path/.test(reasonForFailure) || /Could not find repository/.test(reasonForFailure)) {
          cloneRepo(setting, function(err) {
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

function cloneRepo(setting, cb) {
  console.log('cloning repository...')
  var cmd = util.format('git clone --mirror %s %s', setting.githubUrl, setting.localPath)
  executeCmd(cmd, function(err) {
    if (err) return cb(err)
    console.log('cloning finished')
    cb()
  })
}

function fetchUpdates(setting, cb) {
  console.log('fetching updates...')
  var cmd = util.format('git -C %s fetch', setting.localPath)
  executeCmd(cmd, function(err) {
    if (err) return rb(err)
    console.log('fetching finished')
    cb();
  })
}

function pushToDrupal(setting) {
  return new Promise(function(resolve, reject) {
    console.log('starting push...')
    var cmd = util.format('git -C %s push --tags %s %s', setting.localPath, setting.drupalUrl, setting.branch)
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

app.get('/', function(req, res) {
  res.send('Github Mirror Test')
})

var listener = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = listener.address()
  console.log("Mirror server listening at", addr.address + ":" + addr.port)
})
