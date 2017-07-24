'use strict';

export default function (value, returnEmptyValue) {
  if (!Array.isArray(value)) {
    if (returnEmptyValue) {
      return [];
    }
    return value;
  }
  return value;
};
