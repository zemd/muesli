'use strict';

import ValidationError from './ValidationError';

export default class ConstraintError extends ValidationError {
  constructor(value, tag) {
    super(tag);

    this.propertyValue = value;
  }
}
