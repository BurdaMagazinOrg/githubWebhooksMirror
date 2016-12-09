/**
 * Created by timowelde on 29.03.16.
 */
var express = require('express')
var morgan = require('morgan')
var bodyParser = require("body-parser")

var routes = require('./routes')

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

var app = express()

app.use(morgan('dev'))
app.use(bodyParser.json())

//router.use(express.static(path.resolve(__dirname, 'client')))

app.use('/', routes)

var listener = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = listener.address()
  console.log("Mirror server listening at", addr.address + ":" + addr.port)
})
