const log = require('../../logging')
const db = require('../../db')
const { Pageable,asc,desc,sortMeta } = require('../../common')
module.exports = require('express').Router()

  .get('/history', async (req, res) => {
    const address = req.query.wallet
    let timePeriod = req.query.start && req.query.end ?
      { start: new Date(req.query.start), end: new Date(req.query.end) } : null
    let pageable = new Pageable(
      parseInt(req.query.pageSize) || 10,
      parseInt(req.query.pageNum) || 1
    )

      let sort = req.query.sort
      let sorts = new Map()
      if (!(sort === ''|| sort === null || sort === undefined)){
          sort = sort.split(",")
          for (let i = 0; i < sort.length; i++) {
              let s = sort[i]
              if (s.length > 0 && (s.slice(0,1) === "+" || s.slice(0,1) === "-") && (sortMeta.has(s.slice(1)))){
                  if (s.slice(0,1) === "+"){
                      sorts.set(s.slice(1),asc)
                  }else if (s.slice(0,1) === "-"){
                      sorts.set(s.slice(1),desc)
                  }
              }else{
                  return res.sendStatus(400)
              }
          }
      }

      const result = await db.invoice.listByWallet(req.ctx, address, timePeriod, pageable,sorts)

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