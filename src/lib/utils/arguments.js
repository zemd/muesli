'use strict';

exports.required = (name) => {
  throw new Error(`${name} argument is required`);
};
