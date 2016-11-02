'use strict';

module.exports = function (value, returnEmptyValue = true) {
  if (!Array.isArray(value)) {
    if (returnEmptyValue) {
      return [];
    }
    return value;
  }
  return value;
};
