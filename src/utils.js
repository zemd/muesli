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
import FILTERS from './filters/index';

const DEFAULT_GROUP = 'default';

export { DEFAULT_GROUP };

export const mapAsserts = function (constraints, checkValue, propName, group = DEFAULT_GROUP) {
  return constraints
    .filter((constraint) => typeof constraint === 'function')
    .map((constraint) => {
      return Observable.fromPromise(runAsync(constraint)(checkValue, propName, group))
        .catch((err) => {
          if ('propName' in err || 'props' in err) {
            err.group = group;
            if (!err.statusCode) {
              err.statusCode = 422;
            }
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
    .map((res = []) => res.filter((v) => v instanceof Error));
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
