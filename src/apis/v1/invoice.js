const log = require('../../logging')
const db = require('../../db')
const { Pageable } = require('../../common')
module.exports = require('express').Router()

  .get('/history', async (req, res) => {
    const address = req.query.wallet
    let timePeriod = req.query.start && req.query.end ?
      { start: new Date(req.query.start), end: new Date(req.query.end) } : null
    let pageable = new Pageable(
      parseInt(req.query.pageSize) || 10,
      parseInt(req.query.pageNum) || 1
    )

    const result = await db.invoice.listByWallet(req.ctx, address, timePeriod, pageable)

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

  .get('/:id', async (req, res) => {
    const id = req.params.id
    const result = await db.invoice.findOneById(req.ctx, id)
    result === null ?
      res.sendStatus(404) : res.send(result)
  })

  .get('/transaction/:id', async (req, res) => {
    const id = req.params.id
    const result = await db.invoice.findOneByTxId(req.ctx, id)
    result === null ?
      res.sendStatus(404) : res.send(result)
  })