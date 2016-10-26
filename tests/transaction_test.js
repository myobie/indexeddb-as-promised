const idb = require('../')
const tape = require('blue-tape')

const dbName = 'test-transaction'

tape.onFinish(() => idb.deleteDatabase(dbName))

tape('Transaction', async t => {
  const db = await idb.open(dbName, 1, up => {
    const entries = up.createObjectStore('entries')
    entries.createIndex('folderId')
    up.createObjectStore('folders')
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
      this.folders.add({ id: 'inbox', name: 'Inbox' })
      this.entries.add({ id: 1, folderId: 'inbox', body: 'Hello world' })
    })

    t.test('will rollback if exception in genFn', async t => {
      await t.shouldReject(db.transaction(['folders'], 'rw', function* () {
        this.folders.add({ id: 'trash', name: 'Trash' })
        throw new Error('WTF')
      }))

      const folders = await db.transaction(['folders'], 'r', function* () {
        return yield this.folders.getAll()
      })
      const folderNames = folders.map(f => f.name)
      t.same(folderNames, ['Inbox'])
    })
  })
})
