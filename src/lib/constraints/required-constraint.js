'use strict';

const {ConstraintError} = require('../errors');

module.exports = function (groups = []) {
  function required(fieldValue) {
    const done = this.async();
    setTimeout(() => {
      let err = !!fieldValue ? null : new ConstraintError(fieldValue, 'required');
      done(err);
    }, 0);
  }

  required.groups = groups;

  return required;
};
