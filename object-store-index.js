const { Request } = require('./request')
const { CursorRequest } = require('./cursor-request')

class ObjectStoreIndex {
  constructor (_index, objectStore) {
    this.keyPath = _index.keyPath
    this.multiEntry = _index.multiEntry
    this.name = _index.name
    this.isUnique = this.unique = _index.unique
    this.objectStore = objectStore
    this._index = _index
  }

  count (range) {
    return new Request(() => this._index.count(range), this)
  }

  get (key) {
    return new Request(() => this._index.get(key), this)
  }

  getAll (query, amount) {
    return new Request(() => this._index.getAll(query, amount), this)
  }

  getAllKeys (query, amount) {
    return new Request(() => this._index.getAllKeys(query, amount), this)
  }

  getKey (key) {
    return new Request(() => this._index.getKey(key), this)
  }

  openCursor (range, direction) {
    return new CursorRequest(() => this._index.openCursor(range, direction), this)
  }

  openKeyCursor (range, direction) {
    return new CursorRequest(() => this._index.openKeyCursor(range, direction), this)
  }

  on (eventName) {
    // TODO: event listeners
    throw new Error('on is not implemented')
  }
}

exports.ObjectStoreIndex = ObjectStoreIndex
