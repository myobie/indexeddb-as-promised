const { Request } = require('./request')
const { CursorRequest } = require('./cursor-request')
const { ObjectStoreIndex } = require('./object-store-index')

class ObjectStore {
  constructor (_objectStore, tx) {
    this.autoIncrement = _objectStore.autoIncrement
    this.indexNames = []
    for (let name of _objectStore.indexNames) {
      this.indexNames.push(name)
    }
    this.keyPath = _objectStore.keyPath
    this.name = _objectStore.name
    this.tx = tx
    this._objectStore = _objectStore
  }

  add (item, key) {
    return new Request(() => this._objectStore.add(item, key), this)
  }

  clear () {
    return new Request(() => this._objectStore.clear(), this)
  }

  count (range) {
    return new Request(() => this._objectStore.count(range), this)
  }

  delete (key) {
    return new Request(() => this._objectStore.delete(key), this)
  }

  get (key) {
    return new Request(() => this._objectStore.get(key), this)
  }

  getAll (query, amount) {
    if (typeof query === 'number') {
      amount = query
      query = undefined
    }
    return new Request(() => this._objectStore.getAll(query, amount), this)
  }

  getAllKeys (query, amount) {
    if (typeof query === 'number') {
      amount = query
      query = undefined
    }
    return new Request(() => this._objectStore.getAllKeys(query, amount), this)
  }

  index (name) {
    const _index = this._objectStore.index(name)
    return new ObjectStoreIndex(_index, this)
  }

  openCursor (range, direction, genFn) {
    if (typeof range === 'function' && !direction && !genFn) {
      genFn = range
      range = undefined
    }
    if (range && typeof direction === 'function' && !genFn) {
      genFn = direction
      direction = undefined
    }
    return new CursorRequest(() => this._objectStore.openCursor(range, direction), genFn, this)
  }

  openKeyCursor (range, direction, genFn) {
    if (typeof range === 'function' && !direction && !genFn) {
      genFn = range
      range = undefined
    }
    if (range && typeof direction === 'function' && !genFn) {
      genFn = direction
      direction = undefined
    }
    return new CursorRequest(() => this._objectStore.openKeyCursor(range, direction), genFn, this)
  }

  put (item, key) {
    return new Request(() => this._objectStore.put(item, key), this)
  }

  on (eventName) {
    // TODO: event listeners
    throw new Error('on is not implemented')
  }
}

exports.ObjectStore = ObjectStore
