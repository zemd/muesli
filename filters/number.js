'use strict';

export default function (value, returnEmptyValue = true) {
  if (value == null) {
    if (returnEmptyValue) {
      return 0;
    }
    return value;
  }
  return +value;
};
