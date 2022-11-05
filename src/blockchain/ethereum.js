const { BigNumber, ethers } = require('ethers')
const { Formatter } = require('@ethersproject/providers')
const config = require('../config')
const { Either } = require('../common')
const log = require('../logging')
const formatter = new Formatter()

const conf = {
  network: {
    name: config.blockchain.ethereum.network.name,
    chainId: parseInt(config.blockchain.ethereum.network.chainId)
  },
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
log.trace('chain delegation of ethereum loaded with configuration: %s', JSON.stringify(conf))

module.exports = {
  BigNumber,
  validation: {
    isHash(hx) {
      try { formatter.hash(hx) }
      catch (e) { return false }
      return true
    }
  },
  transaction: {
    // Note: waitUntilConfirm is a blocking function.
    // confirms: If confirms is 0, this method is non-blocking and 
    // if the transaction has not been mined returns null. Otherwise, 
    // this method will block until the transaction has confirms blocks mined 
    // on top of the block in which is was mined.
    // timeoutMs: number of millisecond for unblocking.
    // results: https://docs.ethers.io/v5/api/providers/types/#providers-TransactionReceipt
    waitUntilConfirm: async (tx, confirms, timeoutMs) => {
      const detail = p.getTransaction(tx)
      const receipt = p.waitForTransaction(tx, confirms, timeoutMs)
      return Promise.all([detail, receipt])
        .then(v => Either.fromR({
          detail: v[0],
          receipt: v[1]
        }))
        .catch(e => Either.fromE(e))
    }
  }
}