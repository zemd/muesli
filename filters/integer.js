'use strict';

import toSafeInteger from 'lodash/fp/toSafeInteger';

export default function (value, returnEmptyValue) {
  if (value == null) {
    if (returnEmptyValue) {
      return 0;
    }
    return value;
  }
  return toSafeInteger(value);
};
