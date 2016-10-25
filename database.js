const { Transaction } = require('./transaction')

class Database {
  constructor (_db) {
    this.name = _db.name
    this.version = _db.version
    this.objectStoreNames = _db.objectStoreNames
    this._db = _db
  }

  close () {
    return this._db.close()
  }

  transaction (storeNames, mode, genFn) {
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
