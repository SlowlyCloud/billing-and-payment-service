const log = require('../logging')
const { MongoClient, ObjectId } = require('mongodb')
const { toSyncFn } = require('../common')
const config = require('../config')

const client = new MongoClient(config.database.mongo.uri)
let db = toSyncFn(async () => {
    try {
        // Connect the client to the server (optional starting in v4.7)
        await client.connect();
        // Establish and verify connection
        await client.db("admin").command({ ping: 1 });
        const db = await client.db(config.database.mongo.name)
        log.info('mongodb connected to database: %s', config.database.mongo.name)
        return db
    } catch (e) {
        await client.close()
        throw new Error('mongo starting failed: ' + e)
    }
})

module.exports = {
    ObjectId,
    db: db,
    client: client
}

// graceful shutdown
process.on('SIGTERM', () => toSyncFn(async () => {
    const shutdown = await client.close()
    log.trace('mongodb disconnected %s', shutdown)
}))
