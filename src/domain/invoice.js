const { Meta } = require("../common")
const ethereum = require('../blockchain/ethereum')
const log = require('../logging')

class PaymentInfo {
  constructor(txId, chain, currency, unit, amount, from, to) {
    this.txId = txId
    this.chain = chain
    this.currency = currency
    this.unit = unit
    this.amount = parseFloat(amount)
    this.from = from
    this.to = to
  }

  static from(fromDB) {
    let res = new PaymentInfo()
    res.txId = fromDB.txId
    res.chain = fromDB.chain
    res.currency = fromDB.currency
    res.unit = fromDB.unit
    res.amount = fromDB.amount
    res.from = fromDB.from
    res.to = fromDB.to
    return res
  }
}

class Invoice {
  constructor(paymentInfo, items, totalAmountPaid, note) {
    this.items = items
    this.paymentInfo = paymentInfo
    this.note = note
    this.status = "unconfirmed"
    this.paidAt = undefined
    this.totalAmountPaid = parseFloat(totalAmountPaid)
    this.tip = 0
    this.meta = new Meta()
  }
  
  static from(fromDB) {
    let res = new Invoice()
    res.items = fromDB.items
    res.paymentInfo = PaymentInfo.from(fromDB.paymentInfo)
    res.note = fromDB.note
    res.status = fromDB.status
    res.paidAt = fromDB.paidAt
    res.totalAmountPaid = fromDB.totalAmountPaid
    res.tip = fromDB.tip
    res.meta = fromDB.meta
    return res
  }

  confirms = async (confirms, timeout) => {
    let receipt = await ethereum
      .transaction
      .waitUntilConfirm(this.paymentInfo.txId, confirms, timeout)

    log.info({
      order: this,
      receipt
    }, 'an order has been confirmed')

    // check if amount is equaled with totalAmountPaid in acceptable deviation.
    this.tip = this.paymentInfo.amount - this.totalAmountPaid
    if (this.tip < 0) {
      this.status = 'deficient'
    }

    this.paidAt = new Date()
    this.status = 'completed'

    log.debug('order confirmed by %s, order: %s', this.paymentInfo.chain, this)

    return this.status === 'completed' ? true : false
  }
}

module.exports = {
  PaymentInfo,
  Invoice,
}