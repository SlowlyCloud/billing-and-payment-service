const log = require('../../logging')
const db = require('../../db')
const { Pageble } = require('../../common')
module.exports = require('express').Router()

  .get('/history', async (req, res) => {
    const address = req.query.wallet
    let timePeriod = req.query.start && req.query.end ?
      { start: new Date(req.query.start), end: new Date(req.query.end) } : null
    let pageable = new Pageble(
      parseInt(req.query.pageSize) || 10,
      parseInt(req.query.pageNum) || 1
    )

    const result = await db.invoice.listByWallet(address, timePeriod, pageable)

    res.send({
      total: result.total,
      records: result.records,
      timePeriod: timePeriod,
      nextPage: {
        size: pageable.size,
        number: pageable.size * pageable.number > result.total ?
          pageable.number : pageable.number + 1
      }
    })
  })