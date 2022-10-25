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