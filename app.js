const express = require('express')
const helmet = require('helmet')

const config = require('./config')

const dbMongo = require('./helpers/dbs/dbs-mongo/mongo-db')
const dbMySQL = require('./helpers/dbs/dbs-mysql/mysql-db')

const storeS3 = require('./helpers/stores/stores-S3')

const common = require('./helpers/utils/utils-common')
const response = require('./helpers/utils/utils-response')
const log = require('./helpers/utils/utils-logger')

const app = express()


// -------------------------------------------------
// Database Module
switch (config.schema.get('db.driver')) {
  case 'mongo':
    dbMongo.getConnection()
    break
  case 'mysql':
    dbMySQL.getConnection()
    break
}


// -------------------------------------------------
// Store Module
switch (config.schema.get('store.driver')) {
  case 'aws', 'minio':
    storeS3.getConnection()
    break
}


// -------------------------------------------------
// Express Module
app.use(helmet())

app.use(express.json())

app.use(express.urlencoded({ 
  extended: false,
  limit: config.schema.get('server.upload.limit') + 'mb'
}))

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  next()
})

app.use(function (req, res, next) {
  if (req.url !== '/favicon.ico') {
    log.send('http-access').info('Access Method ' + req.method + ' at URI ' + req.url)
  }
  next()
})


// -------------------------------------------------
// Load Router Handler to Express Module
app.use('/', require('./routes/index'))


// -------------------------------------------------
// Load Default Router Handler to Express Module
app.get('/favicon.ico', (req, res) => res.status(204))

app.use(function (req, res) {
  log.send('http-access').warn('Not Found Method ' + req.method + ' at URI ' + req.url)
  response.resNotFound(res, 'Not Found Method ' + req.method + ' at URI ' + req.url)
})

app.use(function (err, req, res, next) {
  log.send('http-access').error(common.strToTitleCase(err.message))
  response.resInternalError(res, common.strToTitleCase(err.message))
})


// -------------------------------------------------
// Process On Terminate Function
function onTerminate() {
  console.log('')
    
  // Handle Database Connection
  switch (config.schema.get('db.driver')) {
    case 'mongo':
      dbMongo.closeConnection()
      break
    case 'mysql':
      dbMySQL.closeConnection()
      break
  }

  // Gracefully Exit
  process.exit(0)
}

process.on('SIGTERM', onTerminate)
process.on('SIGINT', onTerminate)


// -------------------------------------------------
// Export Module
module.exports = app
