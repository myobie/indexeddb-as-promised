class GeneratorNeverFinishedError extends Error {}

class CursorRequest {
  constructor (factory, genFn, source) {
    this.factory = factory
    this.genFn = genFn
    this.source = source
    this.isRequest = true

    this._request = null
    this._cb = null
  }

  // There is no way this is going to work, but I wanted to at least get my idea down in psuedo code
  run () {
    const source = this.source
    const genFn = this.genFn

    return new Promise((resolve, reject) => {
      let _request
      let gen

      try {
        _request = this.factory()
      } catch (e) {
        reject(e)
        return
      }

      _request.onerror = e => reject(e)

      _request.onsuccess = e => {
        const _cursor = e.target.result

        if (_cursor) {
          const cursor = {
            direction: _cursor.direction,
            primaryKey: _cursor.primaryKey,
            key: _cursor.key,
            value: _cursor.value,
            source
          }

          if (!gen) {
            try {
              gen = genFn(cursor)
            } catch (e) {
              reject(e)
              return
            }
          }

          let result
          try {
            // hand the latest item into the generator at the currently paused point
            result = gen.next(cursor)
          } catch (e) {
            reject(e)
            return
          }

          if (result.done) {
            resolve(result.value)
          } else {
            _cursor.continue(result.value)
          }
        } else {
          if (!gen) {
            // if there is no _cursor and gen was never created, we must have zero results
            resolve()
            return
          }

          let result
          try {
            // no _cursor, next() with nothing one last time to capture the return value
            result = gen.next()
          } catch (e) {
            reject(e)
            return
          }

          if (result.done) {
            resolve(result.value)
          } else {
            // didn't return and didn't ask for anything else, must have yielded again even tho the last yield returned undefined
            reject(new GeneratorNeverFinishedError())
          }
        }
      }
    })
  }
}

CursorRequest.run = function (factory, source) {
  return (new CursorRequest(factory, source)).run()
}

exports.CursorRequest = CursorRequest
