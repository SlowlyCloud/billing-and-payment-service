const { Meta } = require("../common")
const ethereum = require('../blockchain/ethereum')
const { Decimal } = require('decimal.js')

const ETHER_WEI = new Decimal(1000000000000000000)

class PaymentInfo {
  constructor(txId, chain, currency, unit, amount, from, to) {
    amount = amount || 0
    this.txId = txId
    this.chain = chain
    this.currency = currency
    this.unit = unit
    this.amount = new Decimal(amount)
    this.from = from
    this.to = to
  }

  static from(fromDB) {
    let res = new PaymentInfo()
    res.txId = fromDB.txId
    res.chain = fromDB.chain
    res.currency = fromDB.currency
    res.unit = fromDB.unit
    res.amount = new Decimal(fromDB.amount)
    res.from = fromDB.from
    res.to = fromDB.to
    return res
  }
}

class Invoice {
  constructor(paymentInfo, items, totalAmountPaid, note) {
    totalAmountPaid = totalAmountPaid || 0
    this.items = items
    this.paymentInfo = paymentInfo
    this.note = note
    this.status = "unconfirmed"
    this.paidAt = undefined
    this.totalAmountPaid = new Decimal(totalAmountPaid)
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
    res.totalAmountPaid = new Decimal(fromDB.totalAmountPaid)
    res.tip = fromDB.tip
    res.meta = fromDB.meta
    return res
  }

  _validate = (txReceipt) => {
    if (this.paymentInfo.from !== txReceipt.from ||
      this.paymentInfo.to !== txReceipt.to
    ) {
      let e = new Error('payment info of invoice is invalid')
      e.statusCode = 400
      throw e
    }
  }

  isCompleted = () => this.status === 'completed'

  confirms = async (ctx, confirms, timeout) => {
    if (this.isCompleted()) return true

    let res = await ethereum
      .transaction
      .waitUntilConfirm(this.paymentInfo.txId, confirms, timeout)

    res.match(
      (result) => {
        ctx.log.info({
          order: this,
          receipt: result.receipt,
          detail: result.detail
        }, 'an order has been confirmed')

        this._validate(result.receipt)

        this.paymentInfo.amount = new Decimal(
          result.detail.gasLimit
            .mul(result.detail.gasPrice)
            .add(result.detail.value)
            .toString()
        ).div(ETHER_WEI)

        // check if amount is equaled with totalAmountPaid in acceptable deviation.
        this.tip = this.paymentInfo.amount.sub(this.totalAmountPaid)
        if (this.tip.lt(new Decimal(0))) {
          this.status = 'deficient'
        } else {
          this.status = 'completed'
        }

        this.paidAt = new Date()

        ctx.log.debug('order confirmed by %s, order: %s', this.paymentInfo.chain, this)
      },

      (error) => {
        error.statusCode = 400
        throw error
      }
    )

    return this.isCompleted()
  }
}

module.exports = {
  PaymentInfo,
  Invoice,
}