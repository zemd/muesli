'use strict';

const {required} = require('../utils/arguments');

class ValidationError extends Error {
  constructor(tag = required('tag'), group) {
    super();

    this.statusCode = 422;
    this.tag = tag;
    this.group = group;
  }
}

module.exports = ValidationError;
