'use strict';

import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/observable/forkJoin';
import 'rxjs/add/operator/startWith';
import changeCase from 'change-case';
import flatten from 'lodash/fp/flatten';
import difference from 'lodash/fp/difference';
import Emitter from 'rx-emitter';
import { extractDefaultValues, extractFilter, proceedChecks, mapAsserts, DEFAULT_GROUP } from './utils';
import DataWrapper from './src/storage';

const identityFn = (v) => v;

function initGettersSetters(useGetters, useSetters) {
  if (!useGetters && !useSetters) {
    return;
  }

  const getters = useGetters ? this._schema.keys : [];
  const setters = useSetters ? this._schema.keys.filter((prop) => !this._schema.has(`${prop}.computed`)) : [];

  let values = {};
  let descriptors = {};

  getters.forEach((prop) => {
    descriptors[prop] = Object.assign({}, descriptors[prop], {
      get: () => {
        return this.get(prop);
      }
    });
  });

  setters.forEach((prop) => {
    descriptors[prop] = Object.assign({}, descriptors[prop], {
      set: (value) => {
        return this.set(prop, value);
      }
    });
  });

  Object.keys(descriptors)
    .forEach((prop) => {
      Object.defineProperty(values, prop, descriptors[prop])
    });

  Object.defineProperty(this, 'values', {
    get: function () {
      return Object.freeze(values);
    }
  });
}

function initComputedProps() {
  this._schema.keys
    .filter((prop) => !!this._schema.getArray(`${prop}.computed`).length)
    .map((prop) => {
      let subjects = this._schema.getArray(`${prop}.computed`)
        .map((propToObserv) => this.subject(propToObserv).startWith(this.get(propToObserv)));

      return Observable.combineLatest(
        ...subjects
      )
        .subscribe((results) => {
          let oldValue = this.get(prop);
          this._values.setValue(prop, results);
          this.publish(prop, this.get(prop), { oldValue });
        }, (error) => {
          throw error;
        });
    });
}

class Model extends Emitter {
  /**
   * nameStrategy can be:
   *  constant, dot, header, lower, lcFirst, param, pascal, path, sentence, snake, swap, title, upper, ucFirst
   *
   * @param {{}} [schema]
   * @param {string} nameStrategy
   * @param {boolean} strict
   * @param {boolean} throwOnStrictError
   * @param {boolean} returnEmptyValue
   * @param {boolean} immutable
   * @param {boolean} useGetters
   * @param {boolean} useSetters
   * @param {[]} validators
   */
  constructor(schema = {}, {
    nameStrategy = 'camel',
    strict = false,
    throwOnStrictError = false,
    returnEmptyValue = true,
    immutable = false,
    useGetters = true,
    useSetters = true,
    validators = []
  } = {}) {
    super();

    const values = extractDefaultValues(schema);
    const options = {
      nameStrategy,
      strict,
      throwOnStrictError,
      returnEmptyValue,
      immutable,
      useGetters,
      useSetters,
      validators,
    };

    this._schema = new DataWrapper(schema);
    this._values = new DataWrapper(values);
    this._options = new DataWrapper(options);

    initGettersSetters.call(this, !!useGetters, !!useSetters);
    initComputedProps.call(this);
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
    if (this.getOption('strict', false) && !this._schema.has(prop)) {
      if (this.getOption('throwOnStrictError', false)) {
        throw new Error(`There is no such prop to set. ${prop} is trying to be set with value ${value}`);
      }
      // silently ignore value
      return this;
    }

    if (this._schema.getArray(`${prop}.computed`).length) {
      throw new Error(`Can't set computed value`);
    }

    let oldValue = this.get(prop);
    if (this._options.getBoolean('immutable')) {
      return this.fromJSON(Object.assign({}, this._values.raw, { [prop]: value }));
    }

    this._values.setValue(prop, value);

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
    let applyFilterFn = extractFilter(this._schema.getValue(`${prop}.filter`, identityFn));

    return applyFilterFn(
      this._values.getValue(prop, defaultValue),
      this._options.getBoolean('returnEmptyValue', true),
    );
  }

  /**
   * @param {{}} data
   * @return {Model}
   */
  merge(data = {}) {
    const dataKeys = Object.keys(data);
    const source = this.getOption('strict') ? this._schema.keys : dataKeys;

    if (this.getOption('strict') && this.getOption('throwOnStrictError') && difference(dataKeys, this._schema.keys).length) {
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
    return this._values.version;
  }

  /**
   * @param {string} prop
   * @returns {boolean}
   */
  has(prop) {
    return this._values.has(prop);
  }

  /**
   * You can override this function to add specific implementation for checking props' constraints.
   * Must return Observable<Error[]>
   *
   * @param {string} group
   * @returns {Observable<Error[]>}
   */
  validatePropsConstraints(group = DEFAULT_GROUP) {
    let checks = this._schema.keys
      .map((prop) => {
        const constraints = this._schema.getArray(`${prop}.constraints`, []);

        const validate = this._schema.getFunction(`${prop}.validate`);
        if (validate) {
          constraints.push(validate);
        }

        return mapAsserts(constraints, this.get(prop), prop, group);
      });
    return proceedChecks(flatten(checks));
  }

  /**
   * You can override this function to add specific implementation for checking model's validators.
   * Must return Observable<Error[]>
   *
   * @param {string} group
   * @returns {Observable<Error[]>}
   */
  validateModelValidators(group = DEFAULT_GROUP) {
    const checks = mapAsserts(
      this._options.getArray('validators'),
      this.toJSON(),
      undefined,
      group
    );
    return proceedChecks(flatten(checks));
  }

  /**
   * Main function to validate model with each props' constraints and model's validators
   *
   * @param {string} group
   * @param {function} cb
   * @returns {Observable<T[]>}
   */
  validate(group = DEFAULT_GROUP, cb) {
    const validate$ = Observable.forkJoin(
      this.validatePropsConstraints(group),
      this.validateModelValidators(group),

      function (props = [], validators = []) {
        return props.concat(validators)
      }
    );

    if (!cb) {
      return validate$;
    }

    validate$
      .subscribe((res) => cb(null, res), cb);
  }

  /**
   * Serialize Model in pure object
   *
   * @param {string} group
   * @returns {{}}
   */
  toJSON(group = DEFAULT_GROUP) {
    const nameStrategy = this.getOption('nameStrategy');
    let changeCaseMethod = changeCase[nameStrategy] || changeCase.camel;

    return this._schema.keys
      .filter((prop) => !this._schema.getBoolean(`${prop}.json.hidden`, false))
      .filter((prop) => {
        let groups = this._schema.getArray(`${prop}.json.groups`);

        return (!Array.isArray(groups) || !groups.length) ||
          (Array.isArray(groups) && (groups.indexOf(group) > -1 || group === DEFAULT_GROUP))
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
   * @param {string} key
   * @param {*} value
   * @returns {Model}
   */
  setOption(key, value) {
    this._options.setValue(key, value);
    return this;
  }

  /**
   * @param {string} key
   * @param {*=} defaultValue
   * @returns {*}
   */
  getOption(key, defaultValue) {
    return this._options.getValue(key, defaultValue);
  }

  /**
   * @return {Model}
   */
  clone() {
    return this.fromJSON(this._values.raw);
  }
}

Model.DEFAULT_GROUP = DEFAULT_GROUP;

export default Model;
