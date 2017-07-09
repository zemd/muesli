'use strict';

import ValidatorError from '../../errors/ValidatorError';

export const equalPasswords = (groups = ['default']) => {
  return function (obj) {
    if (obj.password && obj.password_repeat && obj.password === obj.password_repeat) {
      return;
    }
    throw new ValidatorError({ password: obj.password, password_repeat: obj.password_repeat }, 'equalPasswords', groups);
  }
};

export const validDates = (groups = ['default']) => {
  return function (obj) {
    const done = this.async();
    setTimeout(() => {
      if (obj.password && obj.password_repeat && obj.password === obj.password_repeat) {
        done(null);
      }
      done(new ValidatorError({ start_date: 'start_date', end_date: 'end_date' }, 'validDates', groups));
    }, 0)
  }
};
