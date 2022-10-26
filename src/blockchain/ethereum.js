const ethers = require('ethers')
const config = require('../config')
const log = require('../logging')

const conf = {
  network: config.blockchain.ethereum.network,
  // refer to: https://docs.ethers.io/v5/api/providers/
  options: {
    alchemy: config.blockchain.ethereum.providers.alchemy.token,
    etherscan: config.blockchain.ethereum.providers.etherscan.token,
    infura: config.blockchain.ethereum.providers.infura,
    pocket: config.blockchain.ethereum.providers.pocket,
    quorum: config.blockchain.ethereum.providers.quorum
  }
}

const p = ethers.providers.getDefaultProvider(conf.network, conf.options)
log.trace('chain delegation of ethereum loaded with configuration: %s', conf)

module.exports = {
  transaction: {
    // Note: waitUntilConfirm is a blocking function.
    // confirms: If confirms is 0, this method is non-blocking and 
    // if the transaction has not been mined returns null. Otherwise, 
    // this method will block until the transaction has confirms blocks mined 
    // on top of the block in which is was mined.
    // timeoutMs: number of millisecond for unblocking.
    // results: https://docs.ethers.io/v5/api/providers/types/#providers-TransactionReceipt
    waitUntilConfirm: async (tx, confirms, timeoutMs) => {
      return await p.waitForTransaction(tx, confirms, timeoutMs)
    }
  }
}