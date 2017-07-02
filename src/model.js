'use strict';

const Rx = require('rxjs/Rx');
const _ = require('lodash');
const changeCase = require('change-case');

const Emitter = require('rx-emitter');

const {ModelError, ModelStrictError} = require('./lib/errors');
const {initDefaultValues, extractFilter, proceedChecks, mapAsserts, provideModifiers} = require('./lib/utils');

const Storage = require('./lib/storage');

const defaultOptions = {
  nameStrategy: 'camel',
  strict: false,
  returnEmptyValue: true,
  immutable: false,
  provideGetters: true,
  provideSetters: true
};

class Model extends Emitter {
  /**
   * nameStrategy can be:
   *  constant, dot, header, lower, lcFirst, param, pascal, path, sentence, snake, swap, title, upper, ucFirst
   *
   * @param {{}} [schema]
   * @param {{}} [options]
   */
  constructor(schema = {}, options = defaultOptions) {
    super();

    this._storage = new Storage(schema, initDefaultValues(schema), Object.assign({}, defaultOptions, options));

    let getters = this._storage.getOptionsBoolValue('provideGetters', true);
    let setters = this._storage.getOptionsBoolValue('provideSetters', true);

    provideModifiers(
      this,
      getters ? this._storage.getSchemaPropsList() : [],
      setters ? this._storage.getSchemaPropsList().filter(prop => !this._storage.hasSchemaPropKey(prop, 'computed')) : []
    );

    if (!this._storage.getOptionsBoolValue('immutable', false)) {
      // -- Proceed with computed properties
      // TODO: utilize this block
      Object.keys(schema)
        .filter((prop) => !!this._storage.getSchemaPropArrayValue(prop, 'computed').length)
        .forEach((prop) => {
          let subjects = this._storage.getSchemaPropArrayValue(prop, 'computed')
            .map(propToObserv => this.subject(propToObserv).startWith(this.get(propToObserv)));

          Rx.Observable.combineLatest(
            ...subjects
          )
            .subscribe((results) => {
              let oldValue = this.get(prop);
              this._storage.setValue(prop, results);
              this.publish(prop, this.get(prop), oldValue);
            }, err => {
              throw err
            });
        });
    }
  }

  /**
   * @returns {number}
   */
  get version() {
    return this._storage.getVersion();
  }

  /**
   * @param {string} prop
   * @returns {boolean}
   */
  has(prop) {
    return this._storage.hasValue(prop);
  }

  /**
   * General getter function to get data from model
   *
   * @param {string} prop
   * @param {*} [defaultValue]
   * @returns {*}
   */
  get(prop, defaultValue) {
    let applyFilterFn = extractFilter(this._storage.getSchemaPropValue(prop, 'filter', _.identity));

    return applyFilterFn(
      this._storage.getValue(prop, defaultValue),
      this._storage.getOptionsBoolValue('returnEmptyValue', true)
    );
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
   * @throws ModelStrictError
   * @throws ModelError
   */
  set(prop, value) {
    if (this._storage.getOptionsBoolValue('strict', false) && !this._storage.hasSchemaProp(prop)) {
      throw new ModelStrictError(`There is no such prop to set. ${prop} is trying to be set with value ${value}`);
    }

    if (this._storage.getSchemaPropArrayValue(prop, 'computed').length) {
      throw new ModelError(`Can't set computed value`);
    }

    let oldValue = this.get(prop);
    if (this._storage.getOptionsBoolValue('immutable')) {
      // TOOD: use `this.clone();` instead
      // avoid infinite set() execution
      let newModel = this.constructor.fromJSON(this.toJSON(), false, {immutable: false});
      newModel.set(prop, value);
      newModel.setOption('immutable', true);
      return newModel;
    }

    this._storage.setValue(prop, value);
    this._storage.incVersion();

    this.publish(prop, value, oldValue);
    if (prop.indexOf('.')) {
      // TODO: run `publish` for each part
    }

    return this;
  }

  /**
   * You can override this function to add specific implementation for checking props' constraints.
   * Must return Observable<Error[]>
   *
   * @param {string} group
   * @returns {Observable<Error[]>}
   */
  validatePropsConstraints(group = Model.DEFAULT_GROUP) {
    let checks = this._storage.getSchemaPropsList()
      .map((prop) => {
        const constraints = this._storage.getSchemaPropArrayValue(prop, 'constraints', []);

        const validate = this._storage.getSchemaPropFunctionValue(prop, 'validate');
        if (validate) {
          constraints.push(validate);
        }

        return mapAsserts(constraints, this.get(prop), prop, group);
      });
    return proceedChecks(_.flatten(checks));
  }

  /**
   * You can override this function to add specific implementation for checking model's validators.
   * Must return Observable<Error[]>
   *
   * @param {string} group
   * @returns {Observable<Error[]>}
   */
  validateModelValidators(group = Model.DEFAULT_GROUP) {
    const checks = mapAsserts(
      this._storage.getOptionsArrayValue('validators', []),
      this.toJSON(),
      undefined,
      group
    );

    return proceedChecks(_.flatten(checks));
  }

  /**
   * Main function to validate model with each props' constraints and model's validators
   *
   * @param {string} group
   * @param {function} cb
   * @returns {Rx.Observable<T[]>}
   */
  validate(group = Model.DEFAULT_GROUP, cb) {
    const validate$ = Rx.Observable.forkJoin(
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
  toJSON(group = Model.DEFAULT_GROUP) {
    const nameStrategy = this.getOption('nameStrategy');
    let changeCaseMethod = changeCase[nameStrategy] || changeCase.camel;

    return this._storage.getSchemaPropsList()
      .filter((prop) => !this._storage.getSchemaPropBoolValue(prop, 'json.hidden', false))
      .filter((prop) => {
        let groups = this._storage.getSchemaPropArrayValue(prop, 'json.groups', []);

        return (!Array.isArray(groups) || !groups.length) ||
          (Array.isArray(groups) && (groups.indexOf(group) > -1 || group === Model.DEFAULT_GROUP))
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
   * Create new Model instance from data object. Due to fromJSON creates new instance each time, immutable option resets
   * to false and then returns back if it was set.
   *
   * @param {{}} data pure object with data
   * @param {boolean} [skip] indicate whether to skip throwing Error when unknown prop is trying to be set
   * @param {{}} [options] custom options passed to new model
   * @returns {Model}
   */
  static fromJSON(data = {}, skip = true, options = {}) {
    const model = new this();

    model.setOptions(Object.assign({}, options));
    let modelImmutable = model.getOption('immutable');
    // avoid immutability during model creation
    model.setOption('immutable', false);

    Object.keys(data)
      .reduce((model, prop) => {
        try {
          model.set(prop, data[prop]);
        } catch (e) {
          if ((!(e instanceof ModelError)) || (!skip)) {
            throw e;
          }
        }
        return model;
      }, model);

    // return back immutable option if was set to true
    model.setOption('immutable', modelImmutable);
    return model;
  }

  /**
   * @param {{}} obj
   */
  setOptions(obj) {
    if (_.isPlainObject(obj)) {
      this._storage.setOptions(obj);
    }
  }

  /**
   * @param {string} key
   * @param {*} value
   * @returns {Model}
   */
  setOption(key, value) {
    this._storage.setOptionValue(key, value);
    return this;
  }

  /**
   * @param {string} key
   * @returns {*}
   */
  getOption(key) {
    return this._storage.getOptionValue(key);
  }

  clone() {
    // TODO:
  }
}

Model.DEFAULT_GROUP = 'default';

module.exports = Model;
