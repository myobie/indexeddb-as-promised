# indexedb as promised

IndexedDB uses callbacks and `IDBRequest`s for async code. This library
wraps things to use `Promise`s instead.

The best docs for IndexedDB are: [MDN - IndexedDB
API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API).

_If you are not already familiar with the IndexedDB API then this library
may seem confusing. Eventually a tutorial will be added to help._

## Usage

### `open` and upgrade

```js
const idb = require('indexeddb-as-promised')

if (idb.isSupported()) {
  idb.open('journal', 2, up => {
    if (up.oldVersion < 1) {
      up.createObjectStore('entries', { keyPath: 'id' })
      up.objectStore('entries').createIndex('createdAt')
    }

    if (up.oldVersion < 2) {
      const folders = up.createObjectStore('folders', { keyPath: 'id' })
      folders.createIndex('entryId')
      folders.createIndex('createdAt')
    }
  }).then(db => console.log(db))
}
```

Instead of passing the upgrade event to the "upgrader callback" we pass
a custom `Upgrader` instance that only exposes the methods that are
useful during an upgrade event and version change transaction.

An `Upgrader` provides:

* `oldVersion`
* `newVersion`
* `createObjectStore`
* `deleteObjectStore`
* `objectStore`

### Transactions

To read or write to the database, one must first start a transaction.

```js
// assuming db is open
db.transaction(['entries'], 'r').run(function* (tx) {
  const entries = tx.objectStore('entries')
  return yield tx.getAll()
}).then(allEntries => console.log(allEntries))
```

Transactions are given a generator callback which represents the
complete lifetime of the trasnaction. Just like IndexedDB, one can only
access object stores through a transaction. The return value of the
generator function will be the result of the promise returned by `run`.

Async `ObjectStore` methods return a `Request`. To wait for a request to
run and have a result, simply `yield` it to the transaction runner. The
runner will give flow control back to the generator function when that
request has been satisfied or errors.

Any exception will abort and rollback the transaction. The promise
returned will be rejected if that happens.

If anything other than a `Request` is yielded an exception is thrown.

The async methods of `ObjectStore` are:

* `add`
* `clear`
* `count`
* `delete`
* `get`
* `getAll`
* `getAllKeys`
* `put`

There also is some suger to make using transactions nicer. One could
rewrite the above example to:

```js
// All objectStores available in a transaction are available as
// properties on the transaction. Also the generator function is bound
// to the transaction instance.
db.transaction(['entries'], 'r', function* () {
  return yield this.entires.getAll()
}).then(all => console.log(all))
```

#### Indexes

An object store can also be queried by any of it's indexes, just like
nomral IndexedDB. An example:

```js
db.transaction(['entries'], 'r', function* () {
  const today = new Date()
  const lastWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 7)
  const range = IDBKeyRange.lowerBound(lastWeek.getTime())
  return yield this.entries.index('createdAt').getAll(range)
}).then(lastWeekEntries => console.log(lastWeekEntries))
```

Indexes are not mutable in IndexedDB, so an `ObjectStoreIndex` provides
these async methods that return `Request`s:

* `count`
* `get`
* `getAll`
* `getAllKeys`
* `getKey`

#### Writing

An example of how to update a journal entrie's subject:

```js
function updateEntry(id, attributes = {}) {
  return db.transaction(['entries'], 'rw', function* () {
    const entry = yield this.entries.get(id)
    const updatedEntry = Object.assign({}, entry, attributes)
    yield this.entries.put(updatedEntry)
    return updatedEntry
  })
}

updateEntry(123, { subject: 'Hello' })
  .then(entry => console.log('updated!', entry))
```

#### Cursors

_NOTE: this probalby won't work out._

Cursors are tricky, becuase they emit `success` over and over on the
same `IDBRequest` until they are finished. In this library cursor
methods return a `CursorRequest` which is a special request which
resoles a promise with a `Cursor` that knows how to iterate through the
results. An example:

```js
db.transaction(['folders'], 'r', function* () {
  const cursor = yield this.folders.openCursor()
  const first = cursor.next()
  const second = cursor.next()
  return [first, second]
})
```

`Cursor`s also implement the `iterator` method so they work with `for
... of`:

```js
function eachFolder (cb) {
  db.transaction(['folders'], 'r', function* () {
    const cursor = yield this.folders.openCursor()
    for (let folder of cursor) {
      cb(folder)
    }
  })
}

// ... somewhere else

eachFolder(folder => html`<li>${folder.name}</li>`)
```

This should allow for any kind of filters or accumulation that one can
imagine.

## Tests

_Coming soon._

I'm using [`blue-tape`](https://github.com/spion/blue-tape) to write simple tests.

See `test.js` and try out `npm t`

## License

MIT → See `LICENSE` file.
