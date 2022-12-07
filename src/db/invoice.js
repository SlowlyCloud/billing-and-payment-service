const log = require('../logging')
const { db, ObjectId } = require('./mongo')

const collname = 'invoices'

function readabilityDecimal(obj) {
  return JSON.parse(JSON.stringify(obj))
}

const save = async (ctx, invoice) => {
  const res = await db
    .collection(collname)
    .insertOne(readabilityDecimal(invoice))

  ctx.log.trace('%s insert one, obj: %s, res: %s', collname, invoice, res)
  return res.insertedId
}

const updateById = async (ctx, id, invoice) => {
  delete invoice._id
  delete invoice.meta


  const res = await db
    .collection(collname)
    .updateOne(
      { _id: id },
      {
        $set: {
          ...readabilityDecimal(invoice),
          'meta.updatedAt': new Date()
        },
        $inc: { 'meta.version': 1 }
      }
    )

  ctx.log.trace('%s update one, obj: %s, res: %s', collname, invoice, res)
  return res
}

const listByWallet = async (ctx, address, timePeriod, pageable, sorts) => {
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

  //Use map to prevent duplication
  let sortFields = new Map()
  if (sorts.size > 0){
    for (let [key,val] of sorts.entries()) {
      switch (key) {
        case "create":
          sortFields.set("create", {"createdAt":val})
          break
        case "update":
          sortFields.set("update", {"updatedAt":val})
          break
        default:
          break
      }
    }
  }

  let res = await db.collection(collname).find(filter)
  if (sortFields.size >0){
    for (let value of sortFields.values()) {
      res.sort(value)
    }
  }
  res.skip(parseInt(pageable.number > 0 ? (pageable.number - 1) * pageable.size : 0))
      .limit(parseInt(pageable.size))
      .toArray()

  ctx.log.trace('%s list many by address, count: %s res: %s', collname, count, res)

  return {
    total: count,
    records: res
  }
}

const findOneById = async (ctx, id) => {
  const result = await db
    .collection(collname)
    .findOne({ _id: new ObjectId(id) })

  ctx.log.trace('%s find one by id, id: %s, res: %s', collname, id, result)
  return result
}

const findOneByTxId = async (ctx, txId) => {
  const result = await db
    .collection(collname)
    .findOne({ 'paymentInfo.txId': txId })

  ctx.log.trace('%s find one by txId, txId: %s, res: %s', collname, txId, result)
  return result
}

module.exports = {
  save,
  updateById,
  listByWallet,
  findOneById,
  findOneByTxId
}