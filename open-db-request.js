class RequestError extends Error {}
class BlockedError extends Error {}
class UpgradeNotHandled extends Error {}

const { Upgrader } = require('./upgrader')

class OpenDBRequest {
  constructor (factory, upgrade) {
    upgrade || (upgrade = () => { throw new UpgradeNotHandled() })

    this.factory = factory
    this.upgrade = upgrade
  }

  run () {
    let _request

    try {
      _request = this.factory()
    } catch (e) {
      return Promise.reject(new RequestError(e))
    }

    return new Promise((resolve, reject) => {
      let _failed = false

      _request.onerror = e => reject(e)
      _request.onsuccess = e => {
        if (!_failed) { resolve(e.target.result) }
      }
      _request.onblocked = e => reject(new BlockedError(e))
      _request.onupgradeneeded = e => {
        const upgrader = new Upgrader(e)
        try {
          this.upgrade(upgrader)
        } catch (err) {
          _failed = true
          reject(err)
        }
      }
    })
  }
}

OpenDBRequest.run = function (factory, upgrade) {
  return (new OpenDBRequest(factory, upgrade)).run()
}

exports.OpenDBRequest = OpenDBRequest
