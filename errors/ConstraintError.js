'use strict';

export default class ConstraintError extends Error {
  constructor(propName, propValue, message) {
    super(message);

    this.propName = propName;
    this.propValue = propValue;
  }
}
