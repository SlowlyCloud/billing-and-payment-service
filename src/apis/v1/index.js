const log = require('../../logging')
const config = require('../../config')
const router = require('express').Router()
const jwt = require('jsonwebtoken')

const kepPem = Buffer.from(config.server.auth.privateKey, 'base64')

if (config.server.env === 'development' && config.server.auth.skip) {
  log.info('authorization middleware loading is skipped for router module %s', __dirname)
} else {

  router.use(async (req, res, next) => {
    const token = (req.get('Authorization') || '').replace('Bearer ', '')
    if (!token) return res.sendStatus(401)
    const decoded = await new Promise((res, rej) => {
      jwt.verify(token, kepPem, {
        algorithms: config.server.auth.algorithms,
        audience: config.server.auth.audience,
        issuer: config.server.auth.issuer
      }, (err, decoded) => {
        decoded ? res(decoded) : (() => {
          err.statusCode = 401
          rej(err)
        })()
      })
    })
    req.jwt = decoded
    req.log.trace('inbound request verified, token: %s, payload: %s', token, decoded)
    next()
  })

  log.info('authorization middleware loaded for router module %s', __dirname)
}

require('../../common').getDirs(__dirname, 1, -1).filter(v => v !== __filename).forEach(file => {
  let apiPath = file.replace(__dirname, '').replace('.js', '')
  log.info('loading router path %s from file: %s ', apiPath, file)
  router.use(apiPath, require(file))
})
log.info('apis %s loaded', __dirname)

module.exports = router