const idb = require('../')
const tape = require('blue-tape')

const dbName = 'test-open'

function openDb () {
  return idb.open(dbName, 1, up => {})
}

tape('isSupported', async t => {
  t.assert(idb.isSupported(), 'isSupported is true')
})

tape('open() returns a promise', async t => {
  let db
  try {
    const promise = openDb()
    t.equal(promise, Promise.resolve(promise), 'returned a promise')
    db = await promise
  } finally {
    if (db) { db.close() }
  }
})

tape('open() resolves to a Database', async t => {
  let db
  try {
    db = await openDb()
    t.same(dbName, db.name, 'database name matches')
    t.ok(db._db, 'has _db property')
  } finally {
    if (db) { db.close() }
  }
})

tape('cmp()', async t => {
  t.equal(idb.cmp('A', 'B'), -1, 'A is less than B')
  t.equal(idb.cmp('B', 'A'), 1, 'B is less than A')
  t.equal(idb.cmp('A', 'A'), 0, 'A is A')
})

tape('deleteDatabase()', async t => {
  try {
    await idb.deleteDatabase(dbName)
    t.pass('deleted')
  } catch (e) {
    t.error(e)
  }
})
