'use strict';

const errors = require('../../src/lib/errors');

exports.equalPasswords = (groups = ['default']) => {
  return function (obj) {
    if (obj.password && obj.password_repeat && obj.password === obj.password_repeat) {
      return;
    }
    throw new errors.ValidatorError({password: obj.password, password_repeat: obj.password_repeat}, 'equalPasswords', groups);
  }
};

exports.validDates = (groups = ['default']) => {
  return function (obj) {
    const done = this.async();
    setTimeout(() => {
      if (obj.password && obj.password_repeat && obj.password === obj.password_repeat) {
        done(null);
      }
      done(new errors.ValidatorError({start_date: 'start_date', end_date: 'end_date'}, 'validDates', groups));
    }, 0)
  }
};
