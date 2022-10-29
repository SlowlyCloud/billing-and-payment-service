const logger = require('../logging')
const { db } = require('./mongo')

const collname = 'invoices'

const save = async (invoice) => {
  const res = await db
    .collection(collname)
    .insterOne(invoice)

  logger.trace('%s insert one, obj: %s, res: %s', collname, invoice, res)
  return res
}

const updateById = async (id, invoice) => {
  const res = await db
    .collection(collname)
    .updateOne(
      { _id: id },
      {
        $set: invoice,
        $inc: { 'meta.version': 1 }
      })

  logger.trace('%s update one, obj: %s, res: %s', collname, invoice, res)
  return res
}

const listByWallet = async (address, timePeriod, pageble) => {
  filter.paymentInfo.from = address

  const count = await db
    .collection(collname)
    .countDocuments(filter)
  if (!count) return { total: 0, records: [] }

  if (timePeriod) {
    filter['meta.createdAt'] = {
      $gte: new Date(timePeriod.start.toISOString()),
      $lt: new Date(timePeriod.end.toISOString())
    }
  }

  let res = await db
    .collection(collname)
    .find(
      filter,
      {
        limit: pageble.size,
        skip: pageble.size * pageble.number
      }
    )
    .toArray()

  log.trace('%s list many by address, count: %s res: %s', count, res)

  return {
    total: count,
    records: res
  }
}

module.exports = {
  save,
  updateById,
  listByWallet
}