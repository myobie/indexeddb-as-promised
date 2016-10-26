const idb = require('../')
const tape = require('blue-tape')

const dbName = 'test-database'

tape.onFinish(() => idb.deleteDatabase(dbName))

tape('Database', async t => {
  const db = await idb.open(dbName, 1, up => {
    up.createObjectStore('entries')
  })

  t.test('name', async t => {
    t.equal(db.name, dbName, 'has correct name')
  })

  t.test('version', async t => {
    t.equal(db.version, 1, 'has correct version')
  })

  t.test('objectStoreNames', async t => {
    t.same(db.objectStoreNames, ['entries'], 'has correct objectStoreNames')
  })
})
