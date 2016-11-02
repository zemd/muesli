'use strict';

const Rx = require('rx');
const _ = require('lodash');
const changeCase = require('change-case');

const Emitter = require('rx-emitter');

const {ModelError, ModelStrictError} = require('./lib/errors');
const {initDefaultValues, extractFilter, proceedChecks, mapAsserts} = require('./lib/utils');

const Storage = require('./lib/storage');

class Model extends Emitter {
  /**
   * nameStrategy can be:
   *  constant, dot, header, lower, lcFirst, param, pascal, path, sentence, snake, swap, title, upper, ucFirst
   *
   * @param {{}} schema
   * @param {{}} options
   */
  constructor(schema = {}, options = {nameStrategy: 'camel', strict: false, returnEmptyValue: true}) {
    super();

    this._storage = new Storage(schema, initDefaultValues(schema), options);

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

  has(prop) {
    return this._storage.hasValue(prop);
  }

  get(prop, defaultValue) {
    let applyFilterFn = extractFilter(this._storage.getSchemaPropValue(prop, 'filter', _.identity));

    return applyFilterFn(
      this._storage.getValue(prop, defaultValue),
      this._storage.getOptionsBoolValue('returnEmptyValue', true)
    );
  }

  set(prop, value) {
    if (this._storage.getOptionsBoolValue('strict', false) && !this._storage.hasSchemaProp(prop)) {
      throw new ModelStrictError(`There is no such prop to set. ${prop} is trying to be set with value ${value}`);
    }

    if (this._storage.getSchemaPropArrayValue(prop, 'computed').length) {
      throw new ModelError(`Can't set computed value`);
    }

    let oldValue = this.get(prop);
    this._storage.setValue(prop, value);

    this.publish(prop, value, oldValue);
    if (prop.indexOf('.')) {
      // TODO: run `publish` for each part
    }

    return this;
  }

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

  validateModelValidators(group = Model.DEFAULT_GROUP) {
    const checks = mapAsserts(
      this._storage.getOptionsArrayValue('validators', []),
      this.toJSON(),
      undefined,
      group
    );

    return proceedChecks(_.flatten(checks));
  }

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
        prev[changeCaseMethod(curr)] = this.get(curr);
        return prev;
      }, {});
  }

  static fromJSON(data = {}, skip = true) {
    const model = new this();
    return Object.keys(data)
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
  }

  setOption(key, value) {
    this._storage.setOptionValue(key, value);
    return this;
  }

  getOption(key) {
    return this._storage.getOptionValue(key);
  }
}

Model.DEFAULT_GROUP = 'default';

module.exports = Model;
