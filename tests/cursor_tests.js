/* global IDBKeyRange */

const idb = require('../')
const tape = require('blue-tape')

const dbName = 'test-cursor'

tape.onFinish(() => idb.deleteDatabase(dbName))

tape('openCursor', async t => {
  let db

  try {
    db = await idb.open(dbName, 1, up => {
      up.createObjectStore('folders', { keyPath: 'id' })
      const entries = up.createObjectStore('entries', { keyPath: 'id' })
      entries.createIndex('folderId')
    })

    await db.transaction(['folders', 'entries'], 'rw', function* () {
      yield this.folders.add({ id: 'inbox', name: 'Inbox' })
      yield this.folders.add({ id: 'trash', name: 'Trash' })
      yield this.entries.add({ id: '1', folderId: 'inbox', body: 'First' })
      yield this.entries.add({ id: '2', folderId: 'inbox', body: 'Second' })
      yield this.entries.add({ id: '3', folderId: 'trash', body: 'Third' })
    })
  } catch (e) {
    t.error(e, 'could not create db or records')
    return
  }

  t.test('will yield items', async t => {
    const firstItem = await db.transaction(['entries'], 'r', function* () {
      return yield this.entries.openCursor(function* (cursor) { return cursor.value })
    })

    t.equal(firstItem.id, '1', 'yielded the first item')
  })

  t.test('will yield all items', async t => {
    const result = await db.transaction(['entries'], 'r', function* () {
      return yield this.entries.openCursor(function* (cursor) {
        let all = [cursor.value]
        while (cursor = yield) { all.push(cursor.value) } // eslint-disable-line no-cond-assign
        return all
      })
    })

    t.equal(result.length, 3, 'yielded 3 entries')
    t.same(result.map(e => e.id), ['1', '2', '3'], 'yielded the correct 3 entries')
  })

  t.test('can continue with a key', async t => {
    const result = await db.transaction(['entries'], 'r', function* () {
      return yield this.entries.openCursor(IDBKeyRange.bound('1', '3'), function* (cursor) {
        const firstItem = cursor.value
        cursor = yield '3' // continue with '3'
        const lastItem = cursor.value
        return [firstItem, lastItem]
      })
    })

    t.equal(result.length, 2, 'yielded the two entries')
    t.same(result.map(e => e.id), ['1', '3'], 'yielded the correct entries')
  })

  t.test("doesn't call the generator if there are no results", async t => {
    let isCalled = false

    const result = await db.transaction(['entries'], 'r', function* () {
      return yield this.entries.openCursor(IDBKeyRange.only('99'), function* (cursor) {
        isCalled = true
        return true
      })
    })

    t.false(isCalled, "didn't call the generator")
    t.equal(result, undefined)
  })

  t.test('on indexes', async t => {
    t.test('can getAll', async t => {
      const result = await db.transaction(['entries'], 'r', function* () {
        return yield this.entries.index('folderId').getAll(IDBKeyRange.only('inbox'))
      })

      t.same(result.map(e => e.id), ['1', '2'], 'returned the two entries in the inbox')
    })
  })
})
