'use strict';

export default function (value, settings = {}) {
  if (value == null) {
    return value;
  }
  return value + '';
};
