/* global define */
define([], function () {
  'use strict';

  var kv_store = {};

  function set(key, val) {
    kv_store[key] = val;
  }

  function get(key) {
    return kv_store[key];
  }

  return {
    set: set,
    get: get
  };
});
