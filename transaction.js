const { ObjectStore } = require('./object-store')

class TransactionAbortedError extends Error {}

class Transaction {
  constructor (_tx, db) {
    this.promise = new Promise((resolve, reject) => {
      let _failed = false

      _tx.oncomplete = e => resolve()

      _tx.onerror = e => {
        if (!_failed) {
          _failed = true
          reject(e)
        }
      }

      _tx.onabort = e => {
        if (!_failed) {
          _failed = true
          reject(new TransactionAbortedError(e))
        }
      }
    })
    this.db = db
    this.mode = _tx.mode
    this.objectStoreNames = []

    for (let name of this.objectStoreNames) {
      this.objectStoreNames.push(name)
      if (!this[name]) {
        this[name] = this.objectStore(name)
      }
    }

    this._tx = _tx
  }

  abort () {
    return this._tx.abort()
  }

  objectStore (name) {
    const _objectStore = this._tx.objectStore(name)
    return new ObjectStore(_objectStore, this)
  }

  on (eventName) {
    // TODO: event listeners
    throw new Error('on is not implemented')
  }

  then (cb) {
    this.promise.then(cb)
  }

  catch (cb) {
    this.promise.catch(cb)
  }

  run (genFn) {
    const gen = genFn.call(this, this)
    const self = this

    return new Promise((resolve, reject) => {
      next()

      function next (lastResult) {
        let request

        try {
          request = gen.next(lastResult)
        } catch (e) {
          reject(e)
          self.abort()
          return
        }

        if (request.done) {
          self.then(() => resolve(request.value))
        } else {
          if (request.value.isRequest) {
            request.value.run()
              .then(result => next(result))
              .catch(err => {
                reject(err)
                self.abort()
              })
          } else {
            reject(new TypeError('yielded something that was not a Request'))
          }
        }
      }
    })
  }
}

exports.Transaction = Transaction
