const log = require('../../logging')
const db = require('../../db')
const { Pageble } = require('../../common')
module.exports = require('express').Router()

  .get('/history', async (req, res) => {
    const address = req.query.wallet
    let timePeriod = req.query.start && req.query.end ?
      { start: new Date(req.query.start), end: new Date(req.query.end) } : null
    let pageble = new Pageble(req.query.pageSize || 10, req.query.pageNum || 0)

    const records = await db.invoice.listByWallet(address, timePeriod, pageble)

    res.send({
      count: records ? records.length : 0,
      records: records,
      timePeriod: timePeriod,
      nextPage: {
        size: req.query.pageSize || 10,
        number: req.query.pageNum + 1
      }
    })
  })