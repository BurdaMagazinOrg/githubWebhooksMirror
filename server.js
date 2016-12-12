/**
 * Created by timowelde on 29.03.16.
 */
var express = require('express')
var morgan = require('morgan')
var bodyParser = require("body-parser")
var cookieParser = require("cookie-parser")
var path = require('path');
var expressSession = require('express-session')
var cookieSession = require('cookie-session')
var flash = require('connect-flash');
var passport = require('./config/passport')

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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(express.static(path.resolve(__dirname, 'public')))

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())
// app.use(expressSession({ secret: 'keyboard cat', resave: true, saveUninitialized: true }))
app.use(cookieSession({name: 'session', keys: ['key1', 'key2']})) //TODO: dev only
app.use(flash());
app.use(passport.initialize())
app.use(passport.session())

app.use('/', routes)

var listener = app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = listener.address()
  console.log("Mirror server listening at", addr.address + ":" + addr.port)
})