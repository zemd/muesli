'use strict';

const _ = require('lodash');

module.exports = {
  string: require('./filters/string-filter'),
  [String.toString()]: require('./filters/string-filter'),
  number: require('./filters/number-filter'),
  [Number.toString()]: require('./filters/number-filter'),
  integer: require('./filters/integer-filter'),
  array: require('./filters/array-filter'),
  [Array.toString()]: require('./filters/array-filter'),
  boolean: require('./filters/boolean-filter'),
  [Boolean.toString()]: require('./filters/boolean-filter')
};
