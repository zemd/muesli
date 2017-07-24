'use strict';

export default function (value, returnEmptyValue) {
  if (value == null) {
    if (returnEmptyValue) {
      return '';
    }
    return value;
  }
  return String(value);
};
