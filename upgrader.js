class Upgrader {
  constructor (event) {
    this.oldVersion = event.oldVersion
    this.newVersion = event.newVersion
    this._db = event.target.result
    this.cachedStores = {}
  }

  createObjectStore (name, opts) {
    const _objectStore = this._db.createObjectStore(name, opts)
    const objectStore = new UpgradingObjectStore(_objectStore)
    this.cachedStores[name] = objectStore
    return objectStore
  }

  deleteObjectStore (name) {
    this._db.deleteObjectStore(name)
    delete this.cachedStores[name]
  }

  objectStore (name) {
    const possibleCachedStore = this.cachedStores[name]
    if (possibleCachedStore) {
      return possibleCachedStore
    } else {
      const _objectStore = this._db.objectStore(name)
      const objectStore = new UpgradingObjectStore(_objectStore)
      this.cachedStores[name] = objectStore
      return objectStore
    }
  }
}

class UpgradingObjectStore {
  constructor (_objectStore) {
    this._objectStore = _objectStore
  }

  createIndex (name, keyPath, opts) {
    this._objectStore.createIndex(name, keyPath, opts)
  }

  deleteIndex (name) {
    this._objectStore.deleteIndex(name)
  }
}

exports.Upgrader = Upgrader
