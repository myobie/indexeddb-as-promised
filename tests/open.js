const idb = require('../')
const tape = require('blue-tape')

tape('isSupported', async (t) => {
  t.assert(idb.isSupported())
})
