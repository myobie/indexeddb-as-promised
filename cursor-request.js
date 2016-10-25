class CursorRequest {
  constructor (factory, source) {
    this.factory = factory
    this.source = source
    this.isRequest = true

    this._request = null
    this._cb = null
  }

  runNewRequest () {
  }

  runExistingRequest () {
  }

  getEach () {
    this.db.transaction(['items'], 'r').run(function* (tx) {
      const cursor = yield this.items.openCursor()
      let items = []
      for (let item of cursor) {
        item.push(item)
      }
      return items
    })
  }

  // There is no way this is going to work, but I wanted to at least get my idea down in psuedo code
  run () {
    const source = this.source
    let _request
    let cursor

    return new Promise((resolve, reject) => {
      try {
        _request = this.factory()
      } catch (e) {
        reject(e)
        return
      }

      _request.onerror = e => reject(e)

      _request.onsuccess = e => {
        const _cursor = e.target.result

        if (cursor) {
          if (_cursor) {
            cursor.currentValue = {
              key: _cursor.key,
              value: _cursor.value
            }
          } else {
            cursor.currentValue = null
            cursor.done = true
          }
        } else {
          if (!_cursor) {
            resolve({})
            return
          }

          cursor = {
            done: false,
            direction: _cursor.direction,
            primaryKey: _cursor.primaryKey,
            currentValue: {
              key: _cursor.key,
              value: _cursor.value
            },
            source
          }

          cursor[Symbol.iterator] = function* () {
            while (!cursor.done) {
              yield cursor.currentValue
            }
          }

          resolve(cursor)
        }
      }
    })
  }
}

CursorRequest.run = function (factory, source) {
  return (new CursorRequest(factory, source)).run()
}

exports.CursorRequest = CursorRequest
