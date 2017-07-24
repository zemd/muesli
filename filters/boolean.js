'use strict';

export default function (value, returnEmptyValue) {
  if (value == null) {
    if (returnEmptyValue) {
      return false;
    }
    return value;
  }
  return !!value;
};
