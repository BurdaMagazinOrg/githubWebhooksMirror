var express = require('express')
var router = express.Router()

var mirror = require('./mirror')

router.get('/', function(req, res) {
  res.send('Github Mirror Test')
})

router.use('/mirror', mirror)

module.exports = router