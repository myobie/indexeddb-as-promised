const idb = require('../')
const tape = require('blue-tape')

const dbName = 'test-transaction'

tape.onFinish(() => idb.deleteDatabase(dbName))

tape('Transaction', async t => {
  const db = await idb.open(dbName, 1, up => {
    up.createObjectStore('folders', { keyPath: 'id' })
    const entries = up.createObjectStore('entries', { keyPath: 'id' })
    entries.createIndex('folderId')
  })

  t.test('mode', async t => {
    t.equal(db.transaction(['folders'], 'r').mode, 'readonly', 'is set correctly')
    t.equal(db.transaction(['folders'], 'rw').mode, 'readwrite', 'is set correctly')
  })

  t.test('objectStoreNames', async t => {
    const tx = db.transaction(['folders', 'entries'], 'r')
    t.same(['entries', 'folders'], tx.objectStoreNames, 'is correct')
  })

  t.test('objectStore', async t => {
    const tx = db.transaction(['folders', 'entries'], 'r')
    t.ok(tx.objectStore('folders'), 'found folders')
    t.ok(tx.folders, 'has folders')
  })

  t.test('abort', async t => {
    const tx = db.transaction(['folders'], 'r')
    tx.abort()
    await t.shouldReject(tx.promise, 'rejected internal promise')
  })

  t.test('run', async t => {
    await db.transaction(['folders', 'entries'], 'rw', function* () {
      yield this.folders.add({ id: 'inbox', name: 'Inbox' })
      yield this.entries.add({ id: 1, folderId: 'inbox', body: 'Hello world' })
    })

    const allFolders = await db.transaction(['folders'], 'r', function* () {
      return yield this.folders.getAll()
    })

    t.same(allFolders.map(f => f.name), ['Inbox'], 'inbox exists')

    t.test('will rollback if exception in genFn', async t => {
      await t.shouldReject(db.transaction(['folders'], 'rw', function* () {
        this.folders.add({ id: 'trash', name: 'Trash' })
        throw new Error('WTF')
      }), 'rolled back transaction because of exception')

      const folders = await db.transaction(['folders'], 'r', function* () {
        return yield this.folders.getAll()
      })

      t.same(folders.map(f => f.name), ['Inbox'], 'only inbox exists')
    })

    t.test('transactions run in order or instantiation', async t => {
      const promises = []
      const names = ['First', 'Second', 'Third']

      names.forEach(name => {
        promises.push(db.transaction(['entries'], 'rw', function* () {
          const entry = yield this.entries.get(1)
          entry.body = name
          yield this.entries.put(entry)
          return { time: (new Date()).getTime(), name }
        }))
      })

      const result = await Promise.all(promises)
      const resultNames = result.sort(r => r.time).reverse().map(r => r.name)

      t.same(resultNames, names, 'names are in order')
    })
  })
})
