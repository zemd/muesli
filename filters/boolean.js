'use strict';

export default function (value, returnEmptyValue = true) {
  if (value == null) {
    if (returnEmptyValue) {
      return false;
    }
    return value;
  }
  return !!value;
};
