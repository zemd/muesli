'use strict';

const _ = require('lodash');
const Rx = require('rx');
const runAsync = require('run-async');
const ValidationError = require('./errors/validation-error');
const {ModelError} = require('./errors');
const Model = require('../model');
const FILTERS = require('./filters');

function filterFunctionGroup(group) {
  return function (f) {
    return !f.groups ||
      (Array.isArray(f.groups) && (f.groups.indexOf(group) > -1) || !f.groups.length) ||
      group === Model.DEFAULT_GROUP;
  }
}

exports.mapAsserts = function (constraints, checkValue, propName, group = Model.DEFAULT_GROUP) {
  return constraints
    .filter(_.isFunction)
    .filter(filterFunctionGroup(group))
    .map((constraint) => {
      return Rx.Observable.fromPromise(() => runAsync(constraint)(checkValue))
        .catch((err) => {
          if (err instanceof ValidationError) {
            err.propertyName = propName;
            err.group = group;

            return Rx.Observable.return(err);
          }
          return Rx.Observable.throw(err);
        });
    });
};

exports.proceedChecks = function (checks = []) {
  if (checks.length === 0) {
    return Rx.Observable.return([]);
  }

  return Rx.Observable.forkJoin(
    ...checks
  )
    .map((res = []) => res.filter((v) => !!v));
};


exports.initDefaultValues = function (attrs = {}) {
  return Object.keys(attrs)
    .reduce((values, attrKey) => {
      let property = attrs[attrKey];
      let val = property.value;

      if (_.isFunction(property.value)) {
        val = property.value();
      }

      values[attrKey] = val;
      return values;
    }, {});
};

exports.extractFilter = function (filter) {
  if (FILTERS[_.toString(filter)]) {
    return FILTERS[filter];
  } else if (_.isFunction(filter)) {
    return filter;
  }
  throw new ModelError(`No filter defined with ${_.toString(filter)} name`);
};
