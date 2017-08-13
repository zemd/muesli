'use strict';

export default function (value, settings = {}) {
  if (!Array.isArray(value)) {
    return [value];
  }
  return value;
};
