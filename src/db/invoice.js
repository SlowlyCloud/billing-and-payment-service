const log = require('../logging')
const { db,ObjectId } = require('./mongo')

const collname = 'invoices'

const save = async (invoice) => {
  const res = await db
    .collection(collname)
    .insertOne(invoice)

  log.trace('%s insert one, obj: %s, res: %s', collname, invoice, res)
  return res.insertedId
}

const updateById = async (id, invoice) => {
  delete invoice._id
  delete invoice.meta


  const res = await db
    .collection(collname)
    .updateOne(
      { _id: id },
      {
        $set: {
          ...invoice,
          'meta.updatedAt': new Date()
        },
        $inc: { 'meta.version': 1 }
      }
    )

  log.trace('%s update one, obj: %s, res: %s', collname, invoice, res)
  return res
}

const listByWallet = async (address, timePeriod, pageable) => {
  let filter = {}
  filter['paymentInfo.from'] = address
  if (timePeriod) {
    filter['meta.createdAt'] = {
      $gte: new Date(timePeriod.start.toISOString()),
      $lt: new Date(timePeriod.end.toISOString())
    }
  }

  const count = await db
    .collection(collname)
    .countDocuments(filter)
  if (!count) return { total: 0, records: [] }

  let res = await db
    .collection(collname)
    .find(filter)
    .skip(parseInt(pageable.number > 0 ? (pageable.number - 1) * pageable.size : 0))
    .limit(parseInt(pageable.size))
    .toArray()

  log.trace('%s list many by address, count: %s res: %s', collname, count, res)

  return {
    total: count,
    records: res
  }
}

const findOneById = async (id) => {
  const result = await db
    .collection(collname)
    .findOne({ _id: new ObjectId(id) })

  log.trace('%s find one by id, id: %s, res: %s',collname, id, result)
  return result
}

const findOneByTxId = async (txId) => {
  const result = await db
    .collection(collname)
    .findOne({ 'paymentInfo.txId': txId })

  log.trace('%s find one by txId, txId: %s, res: %s',collname, txId, result)
  return result
}

module.exports = {
  save,
  updateById,
  listByWallet,
  findOneById,
  findOneByTxId
}