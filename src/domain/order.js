const { Meta } = require("../common")
const PaymentInfo = require('./valueobj/payment_info')
const ethereum = require('../blockchain/ethereum')
const log = require('../logging')
// Todo: waiting for implementation
const repository = undefined

// Todo: import from configuration
const conf = {
  minimumConfirms: 1,
  confirmingTimeout: 30 * 1000
}

module.exports = class Order {
  constructor(buyerId, sellerId, paymentInfo, items, totalAmountPaid, note) {
    this.id = undefined
    this.buyerId = buyerId
    this.sellerId = sellerId
    this.buyerInfo = undefined
    this.sellerInfo = undefined
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
    
    // Todo: waiting for implementation
    this.meta.update()

    // should replace to api tier
    let res = await repository.update(this)
    log.debug('order updated via repository, id: %s, res: %s', this.id, res)

    return this.status === 'completed' ? true : false
  }
}