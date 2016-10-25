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
    return new Request(() => this._objectStore.getAll(query, amount), this)
  }

  getAllKeys (query, amount) {
    return new Request(() => this._objectStore.getAllKeys(query, amount), this)
  }

  index (name) {
    const _index = this._objectStore.index(name)
    return new ObjectStoreIndex(_index, this)
  }

  openCursor (range, direction) {
    return new CursorRequest(() => this._objectStore.openCursor(range, direction), this)
  }

  openKeyCursor (range, direction) {
    return new CursorRequest(() => this._objectStore.openKeyCursor(range, direction), this)
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
