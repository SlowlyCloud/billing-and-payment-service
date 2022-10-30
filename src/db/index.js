const log = require('../logging')
let modules = {}
require('../common')
  .getDirs(__dirname, 1, -1)
  .filter(v => v !== __filename && !v.includes("mongo.js"))
  .forEach(
    file => {
      let collection = file.replace(__dirname, '').replace('.js', '').replace('/', '')
      log.info('loading db module "%s" from file: %s ', collection, file)
      modules[collection] = require(file)
    }
  )

module.exports = {
  ...modules
}