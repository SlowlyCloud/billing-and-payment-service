const { Meta } = require("../common")
const PaymentInfo = require('./payment_info')
const ethereum = require('../blockchain/ethereum')
const log = require('../logging')
const config = require('../config')
// Todo: waiting for implementation
const repository = undefined

const conf = {
  minimumConfirms: config.blockchain.ethereum.transaction.confirming.minimum,
  confirmingTimeout: config.blockchain.ethereum.transaction.confirming.timeout
}

log.trace('domain Order configuration loaded: %s', conf)

module.exports = class PaymentInfo {
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

module.exports = class Order {
  constructor(buyerId, sellerId, paymentInfo, items, totalAmountPaid, note) {
    this.id = undefined
    this.buyerId = buyerId
    this.sellerId = sellerId
    this.items = items
    this.paymentInfo = new PaymentInfo(
      paymentInfo.txId,
      paymentInfo.chain,
      paymentInfo.currency,
      paymentInfo.unit,
      paymentInfo.amount,
      paymentInfo.from,
      paymentInfo.to
    )
    this.note = note
    this.status = "unconfirmed"
    this.paidAt = undefined
    this.totalAmountPaid = totalAmountPaid
    this.tip = 0
    this.meta = new Meta()
  }

  confirms = async () => {
    let receipt = await ethereum
      .transaction
      .waitUntilConfirm(this.paymentInfo.txId, conf.minimumConfirms, conf.confirmingTimeout)

    log.info({
      order: this,
      receipt
    }, 'an order has been confirmed')

    // check if amount is equaled with totalAmountPaid in acceptable deviation.
    this.tip = this.paymentInfo.amount - this.totalAmountPaid
    if (this.tip < 0) {
      this.status = 'deficient'
    }

    this.status = 'completed'
    this.meta.update()

    // should replace to api tier
    let res = await repository.update(this)
    log.debug('order updated via repository, id: %s, res: %s', this.id, res)

    return this.status === 'completed' ? true : false
  }
}