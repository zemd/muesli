'use strict';

const ValidationError = require('./validation-error');

class ConstraintError extends ValidationError {
  constructor(value, tag) {
    super(tag);

    this.propertyValue = value;
  }
}

module.exports = ConstraintError;
