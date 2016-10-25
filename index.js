/* global indexedDB */

const { OpenDBRequest } = require('./open-db-request')
const { Database } = require('./database')

exports.open = function (name, version, upgrade) {
  return OpenDBRequest
    .run(() => indexedDB.open(name, version), upgrade)
    .then(_db => new Database(_db))
}

exports.deleteDatabase = function (name) {
  return OpenDBRequest.run(() => indexedDB.deleteDatabase(name))
}

exports.cmp = function (first, second) {
  return indexedDB.cmp(first, second)
}

exports.isSupported = function () {
  return typeof window.indexedDB !== 'undefined'
}
