const { Meta } = require("../common")
const ethereum = require('../blockchain/ethereum')
const log = require('../logging')

class PaymentInfo {
  constructor(txId, chain, currency, unit, amount, from, to) {
    this.txId = txId
    this.chain = chain
    this.currency = currency
    this.unit = unit
    this.amount = amount
    this.from = from
    this.to = to
  }
}

class Invoice {
  constructor(paymentInfo, items, totalAmountPaid, note) {
    this.id = undefined
    this.items = items
    this.paymentInfo = paymentInfo
    this.note = note
    this.status = "unconfirmed"
    this.paidAt = undefined
    this.totalAmountPaid = totalAmountPaid
    this.tip = 0
    this.meta = new Meta()
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
    this.meta.update()
    
    log.debug('order confirmed by %s, order: %s', this.paymentInfo.chain, this)

    return this.status === 'completed' ? true : false
  }
}

module.exports = {
  PaymentInfo,
  Invoice,
}