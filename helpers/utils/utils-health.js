const config = require ('../../config')
const response = require('./utils-response')
const log = require('./utils-logger')

const dbMongo = require('../dbs/dbs-mongo/mongo-db')
const dbMySQL = require('../dbs/dbs-mysql/mysql-db')


// -------------------------------------------------
// Health Check Function
async function healthCheck(res) {
  switch (config.schema.get('db.driver')) {
    case 'mongo':
      if (! await dbMongo.getPing()) {
        log.send('service-health').error('Cannot Get Mongo Database Ping')
        response.resInternalError(res, 'Cannot Get Mongo Database Ping')
        return
      }
      break
    case 'mysql':
      if (! await dbMySQL.getPing()) {
        log.send('service-health').error('Cannot Get MySQL Database Ping')
        response.resInternalError(res, 'Cannot Get MySQL Database Ping')
        return
      }
      break
  }

  response.resSuccess(res, 'Service is Healthy')
}


// -------------------------------------------------
// Export Module
module.exports = {
  healthCheck
}
