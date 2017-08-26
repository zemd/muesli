'use strict';

import changeCase from 'change-case';
import difference from 'lodash/fp/difference';
import Emitter from 'rx-emitter';
import { extractDefaultValues, extractFilter, filterConstraints, DEFAULT_GROUP } from './utils';
import has from 'lodash/fp/has';
import get from 'lodash/fp/getOr'; // getOr(defaultValue, path, object)
import { initComputedProps, initGettersSetters } from './mixins';
import { validate, normalizeConstraintsMap } from './validate';

const identityFn = (v) => v;

class Model extends Emitter {
  constructor() {
    super();
    this.props = get({}, 'props', this.constructor);
    this.propsSettings = Object.assign({
      nameStrategy: '',
      strict: false,
      throwOnStrictError: false,
      immutable: false,
      useGetters: true,
      useSetters: true,
      validators: [],
    }, get({}, 'propsSettings', this.constructor));

    this._values = extractDefaultValues(this.props);

    initGettersSetters(this);
    initComputedProps(this);
    this._version = 1;
  }

  /**
   * Create new Model instance from data object.
   *
   * @param {{}} data pure object with data
   * @returns {Model}
   */
  static fromJSON(data = {}) {
    return (new this()).merge(data);
  }

  /**
   * General setter for setting model props' values. If model's option 'immutable' is set to true, this function return
   * new Model instance. CAUTION: immutability means that events won't work after setting new values. So publish method
   * won't be executed.
   *
   * @param {string} prop
   * @param {*} value
   * @returns {Model}
   *
   * @throws Error
   */
  set(prop, value) {
    if (this.propsSettings.strict && this.props[prop] == null) {
      if (this.propsSettings.throwOnStrictError) {
        throw new Error(`There is no such prop to set. ${prop} is trying to be set with value ${value}`);
      }
      // silently ignore value
      return this;
    }

    if (get([], `${prop}.computed`, this.props).length) {
      throw new Error(`Can't set computed value`);
    }

    let oldValue = this.get(prop);
    if (this.propsSettings.immutable) {
      return this.constructor.fromJSON(Object.assign({}, this._values, { [prop]: value }));
    }

    this._values[prop] = value;
    this._version += 1;

    this.publish(prop, value, { oldValue });
    return this;
  }

  /**
   * General getter function to get data from model
   *
   * @param {string} prop
   * @param {*} [defaultValue]
   * @returns {*}
   */
  get(prop, defaultValue) {
    const filter = get(identityFn, `${prop}.filter`, this.props);
    const applyFilterFn = extractFilter(filter);

    return applyFilterFn(
      get(defaultValue, prop, this._values),
      Object.assign({}, this.propsSettings),
    );
  }

  /**
   * @param {{}} data
   * @return {Model}
   */
  merge(data = {}) {
    const dataKeys = Object.keys(data);
    const propsList = Object.keys(this.props);
    const source = this.propsSettings.strict ? propsList : dataKeys;

    if (this.propsSettings.strict &&
      this.propsSettings.throwOnStrictError &&
      difference(dataKeys, propsList).length) {
      throw new Error(`Data contains attributes which were not defined in model's schema`);
    }
    const values = source.reduce((values, prop) => {
      if (prop in data) {
        values[prop] = data[prop];
      }
      return values;
    }, {});

    Object.keys(values)
      .forEach((prop) => {
        this.set(prop, values[prop]);
      });

    return this;
  }

  /**
   * @returns {number}
   */
  get version() {
    return this._version;
  }

  /**
   * @param {string} prop
   * @returns {boolean}
   */
  has(prop) {
    return has(prop, this._values);
  }

  /**
   * Main function to validate model with each props' constraints and model's validators
   *
   * @param {string=} group
   * @param {function=} cb
   * @returns {Promise<T[]>}
   */
  validate(group, cb) {
    const propsConstraints = filterConstraints(normalizeConstraintsMap(this.props), group);

    const [...constraints] = Object.keys(propsConstraints)
      .map((prop) => {
        return validate(propsConstraints[prop], this.get(prop), prop);
      });

    const validators = validate(this.propsSettings.validators, this.toJSON({ group }));

    return Promise.all(
      validators
        .concat(...constraints)
    )
      .then((errors) => {
        return errors
          .filter((error) => error instanceof Error)
          .map((error) => {
            error.group = group;
            return error;
          });
      })
      .then((errors) => {
        if (cb) {
          cb(null, errors);
        }
        return errors;
      })
      .catch((error) => {
        if (cb) {
          cb(error);
        }
        return Promise.reject(error);
      });
  }

  /**
   * Serialize Model in pure object
   *
   * @param {string=} group
   * @param {string=} customNameStrategy
   * @returns {{}}
   */
  toJSON({ group = DEFAULT_GROUP, customNameStrategy } = {}) {
    const nameStrategy = customNameStrategy || this.propsSettings.nameStrategy;
    let changeCaseMethod = changeCase[nameStrategy] || identityFn;

    return Object.keys(this.props)
      .filter((prop) => !get(false, `${prop}.json.hidden`, this.props))
      .filter((prop) => {
        let groups = get([], `${prop}.json.groups`, this.props);

        return (!Array.isArray(groups) || !groups.length) ||
          (Array.isArray(groups) && (groups.indexOf(group) > -1 || group === DEFAULT_GROUP));
      })
      .reduce((prev, curr) => {
        let val = this.get(curr);
        if (val instanceof Model) {
          val = val.toJSON();
        }
        prev[changeCaseMethod(curr)] = val;
        return prev;
      }, {});
  }

  /**
   * @return {Model}
   */
  clone() {
    return this.constructor.fromJSON(this._values);
  }
}

export default Model;
