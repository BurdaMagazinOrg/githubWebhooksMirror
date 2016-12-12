var express = require('express')
var router = express.Router()

var mirror = require('./mirror')
var admin = require('./admin')

router.get('/', function(req, res) {
  res.send('Github Mirror Test')
})

router.use('/mirror', mirror)
router.use('/admin', admin)

module.exports = router