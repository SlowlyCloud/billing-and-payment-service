const express = require('express')
require('express-async-errors')
const bodyParser = require('body-parser')
const log = require('./logging')
const config = require('./config')
const { getDirs, toSyncFn } = require('./common')
const app = express()

// config
const apisFolderName = 'apis'
const port = config.server.port
const basePath = config.server.basePath

app.use((req, res, next) => {
  log.debug({
    direction: 'inbound',
    req: req
  })
  res.on("finish", () => log.debug({
    direction: 'outbound',
    res: res
  }))
  next()
})

app.use(bodyParser.json())

// load & register all routers by their relative path
var path = require('path').join(__dirname, apisFolderName)
log.info('start loading router from path: %s ...', path)
getDirs(path, '2', 1).filter(v => /.*\/v[0-9]{1}$/.test(v)).forEach(moduleDir => {
  let apiPath = basePath + moduleDir.replace(path, '')
  log.info('module: %s loading...', moduleDir)
  app.use(apiPath, require(moduleDir))
  log.info('registered path of router: %s', apiPath)
})
getDirs(path, '1', 1).forEach(file => {
  let apiPath = basePath + file.replace(path, '').replace('.js', '')
  log.info('file: %s loading...', file)
  app.use(apiPath, require(file))
  log.info('registered path of router: %s', apiPath)
})

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).send(err.message)
  log.error({
    err: err,
    req: req,
    res, res
  })
  next()
})

const server = app.listen(port, () => {
  log.info(`Billing and Payment Service Started on Port ${port} with Base Path ${basePath}`)
})

// graceful shutdown
process.on('SIGTERM', toSyncFn(async () => {
  const info = await new Promise((res, rej) => {
    server.close((e) => {
      e ? rej(e) : res(true)
    })
  })
  log.trace('Billing and Payment Service Shutting down %s', info)
}))