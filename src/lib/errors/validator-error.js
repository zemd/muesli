'use strict';

const ValidationError = require('./validation-error');

class ValidatorError extends ValidationError {
  constructor(props, tag, group) {
    super(tag, group);

    this.props = props;
  }
}
module.exports = ValidatorError;
