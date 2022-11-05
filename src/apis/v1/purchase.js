const log = require('../../logging')
const { Invoice, PaymentInfo } = require('../../domain/invoice')
const db = require('../../db')
const { validation } = require('../../blockchain/ethereum')
const validations = {
  '/ethereum/sync': (req, res) => {
    if (!validation.isHash(req)) {
      res.status(400).send('paymentInfo.txId is invalid.')
      return false
    }
  }
}

module.exports = require('express').Router()
  .post('/ethereum/sync', async (req, res) => {
    if (!validations[req.route.path](req, res)) return
    const confirms = req.query.minimumConfirms
    const timeout = req.query.waitingFor
    const o = req.body
    log.debug({ req, reqBody: req.body }, 'new purchase request')

    if (!o.paymentInfo.txId) return res.status(400).send('transaction id is missing')

    o.paymentInfo.chain = o.paymentInfo.chain || 'ethereum'
    o.paymentInfo.currency = o.paymentInfo.currency || 'ETH'
    o.paymentInfo.unit = o.paymentInfo.unit || 'ether'

    let invoice = null
    let id = null

    const exist = await db.invoice.findOneByTxId(o.paymentInfo.txId)
    if (!exist) {
      const paymentInfo = new PaymentInfo(o.paymentInfo.txId, 'ethereum', o.paymentInfo.currency, o.paymentInfo.unit, o.paymentInfo.amount, o.paymentInfo.from, o.paymentInfo.to)
      invoice = new Invoice(paymentInfo, o.items, o.totalAmountPaid, o.note)
      id = await db.invoice.save(invoice)
    } else {
      log.info('invoice of transaction id: $s already exist, confirming payment status')
      invoice = Invoice.from(exist)
      id = exist._id
    }

    log.info('new invoice charging: %s', invoice)
    const succeed = await invoice.confirms(confirms, timeout)
    await db.invoice.updateById(id, invoice)
    const result = res.send(await db.invoice.findOneById(id))
    if (succeed) {
      return result
    } else {
      return res.status(400).send({
        result,
        error: 'Invoice created but transaction confirmation failed'
      })
    }
  })