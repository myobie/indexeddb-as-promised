class Request {
  constructor (factory, source) {
    this.factory = factory
    this.source = source
    this.isRequest = true
  }

  run () {
    return new Promise((resolve, reject) => {
      let _request

      try {
        _request = this.factory()
      } catch (e) {
        reject(e)
        return
      }

      _request.onerror = e => reject(e)
      _request.onsuccess = e => resolve(e.target.result)
    })
  }
}

Request.run = function (factory, source) {
  return (new Request(factory, source)).run()
}

exports.Request = Request
