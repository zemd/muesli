'use strict';

import toSafeInteger from 'lodash/fp/toSafeInteger';

export default function (value, settings = {}) {
  if (value == null) {
    return value;
  }
  return toSafeInteger(value);
};
