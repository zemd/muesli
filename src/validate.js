'use strict';

import runAsync from 'run-async';
import get from 'lodash/fp/getOr'; // getOr(defaultValue, path, object)

/**
 * output:
 * {
 *   field1: [constraint1, constraint12, constraint13],
 *   field2: [constraint2, constraint22, constraint23],
 *   field3: [],
 * }
 * @return {{}}
 */
export const normalizeConstraintsMap = (props) => {
  return Object.keys(props)
    .reduce((acc, prop) => {
      const constraints = []
        .concat(get([], `${prop}.constraints`, props))
        .concat(get([], `${prop}.validate`, props))
        .filter((constraint) => typeof constraint === 'function');

      if (constraints.length) {
        acc[prop] = constraints;
      }
      return acc;
    }, {});
};

/**
 * @param {function} constraint
 * @param {*} value
 * @param {string=} prop
 * @return {Promise<Error>}
 */
const doValidate = (constraint, value, prop) => {
  return Promise.resolve(runAsync(constraint)(value, prop))
    .catch((error) => {
      if ('propName' in error || 'props' in error) {
        if (!error.statusCode) {
          error.statusCode = 422;
        }
        return error;
      }
      return Promise.reject(error);
    });
};

/**
 * @param {function[]|function} constrains
 * @param {*} value
 * @param {string=} prop
 * @return {Promise<Error[]>[]}
 */
export const validate = (constrains, value, prop) => {
  if (!Array.isArray(constrains)) {
    return [doValidate(constrains, value, prop)];
  }
  return constrains
    .map((constraint) => doValidate(constraint, value, prop));
};

/**
 * const props = {
 *  first_name: {
 *    constraints: [required, mustBeCamelCased, mustBeInEnglish],
 *  },
 *  date: {
 *    constraints: [mustBeInThePast],
 *  },
 * };
 *
 * const object = {
 *  first_name: 'Hello World',
 *  date: '2010-10-10',
 * };
 *
 * const propsSettings = {
 *  validators: [mustIncludeFirstNameAndDate],
 * };
 *
 * const propsConstraints = normalizeConstraints(props);
 *
 * const constraints = Object.keys(propsConstraints).map((prop) => validate(propsConstraints[prop], obj[prop], prop));
 * const validators = validate(validators, obj);
 *
 * Promise.all([
 *  ...constraints,
 *  ...validators,
 * ])
 * .then((errors) => {
 *
 * });
 */
