'use strict';

// NOTE: this is example constraint

import ConstraintError from '../errors/ConstraintError';

export default function (groups = []) {
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
