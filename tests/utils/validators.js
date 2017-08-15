'use strict';

import ValidateError from '../../errors/ValidateError';

export const equalPasswords = (groups = ['default']) => {
  return function (obj) {
    if (obj.password && obj.password_repeat && obj.password === obj.password_repeat) {
      return;
    }
    throw new ValidateError({ password: obj.password, password_repeat: obj.password_repeat }, 'Password fields must be equal');
  }
};

export const validDates = (groups = ['default']) => {
  return function (obj) {
    const done = this.async();
    setTimeout(() => {
      if (obj.password && obj.password_repeat && obj.password === obj.password_repeat) {
        done(null);
      }
      done(new ValidateError({ start_date: 'start_date', end_date: 'end_date' }, 'Dates must be valid'));
    }, 0)
  }
};
