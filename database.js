const { Transaction } = require('./transaction')

class Database {
  constructor (_db) {
    this.name = _db.name
    this.version = _db.version
    this.objectStoreNames = []
    for (let name of _db.objectStoreNames) {
      this.objectStoreNames.push(name)
    }
    this._db = _db
  }

  close () {
    return this._db.close()
  }

  transaction (storeNames, mode, genFn) {
    if (mode === 'r') { mode = 'readonly' }
    if (mode === 'rw') { mode = 'readwrite' }

    const _tx = this._db.transaction(storeNames, mode)
    const tx = new Transaction(_tx, this)

    if (typeof genFn === 'function') {
      return tx.run(genFn)
    } else {
      return tx
    }
  }

  on (eventName) {
    // TODO: make this work for the events
    throw new Error('on is not implemented')
  }
}

exports.Database = Database
