'use strict';

export default function (value, returnEmptyValue = true) {
  if (value == null) {
    if (returnEmptyValue) {
      return '';
    }
    return value;
  }
  return String(value);
};
