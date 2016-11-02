'use strict';

const _ = require('lodash');

module.exports = function (value, returnEmptyValue = true) {
  if (_.isNil(value)) {
    if (returnEmptyValue) {
      return false;
    }
    return value;
  }
  return !!value;
};
