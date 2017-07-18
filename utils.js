'use strict';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromPromise';
import 'rxjs/add/observable/of';
import 'rxjs/add/observable/throw';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/catch';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import runAsync from 'run-async';
import ValidationError from './errors/ValidationError';
import FILTERS from './src/filters';

const DEFAULT_GROUP = 'default';

export { DEFAULT_GROUP };

function filterFunctionGroup(group) {
  return function (f) {
    return !f.groups ||
      (Array.isArray(f.groups) && (f.groups.indexOf(group) > -1) || !f.groups.length) ||
      group === DEFAULT_GROUP;
  }
}

export const mapAsserts = function (constraints, checkValue, propName, group = DEFAULT_GROUP) {
  return constraints
    .filter((constraint) => typeof constraint === 'function')
    .filter(filterFunctionGroup(group))
    .map((constraint) => {
      return Observable.fromPromise(runAsync(constraint)(checkValue))
        .catch((err) => {
          if (err instanceof ValidationError) {
            err.propertyName = propName;
            err.group = group;

            return Observable.of(err);
          }
          return Observable.throw(err);
        });
    });

};

/**
 * Executes all check functions and returns observable with filtered array of results
 *
 * @param {function[]} checks
 * @returns {Observable<Error[]>}
 */
export const proceedChecks = function (checks = []) {
  if (checks.length === 0) {
    return Observable.of([]);
  }

  return Observable.forkJoin(
    ...checks
  )
    .map((res = []) => res.filter((v) => !!v));
};


export const extractDefaultValues = function (schema = {}) {
  return Object.keys(schema)
    .reduce((values, attrKey) => {
      let property = schema[attrKey];
      let val = property.value;

      if (typeof property.value === 'function') {
        val = property.value();
      }

      values[attrKey] = val;
      return values;
    }, {});
};

export const extractFilter = function (filter) {
  if (FILTERS[`${filter}`]) {
    return FILTERS[filter];
  } else if (typeof filter === 'function') {
    return filter;
  }
  throw new Error(`No filter defined with ${filter} name`);
};
