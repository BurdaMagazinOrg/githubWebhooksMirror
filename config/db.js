var low = require('lowdb')
const db = low('db.json')
db.defaults({ repositories: {}, users: []}).value()

module.exports = db