'use strict';

const _ = require('lodash');

const data = new WeakMap();

class Storage {
  constructor(schema = {}, values = {}, options = {}) {
    data.set(this, {schema: schema, values: values, options: options, version: 1});
  }

  hasValue(prop) {
    return _.has(data.get(this).values, prop);
  }

  setValue(prop, value) {
    let obj = data.get(this);
    _.set(obj.values, prop, value);
    data.set(this, obj);
  }

  getValues() {
    return _.cloneDeep(data.get(this).values);
  }

  getValue(prop, defaultValue) {
    return _.get(data.get(this).values, prop, defaultValue)
  }

  getOptions() {
    return _.cloneDeep(data.get(this).options);
  }

  getOptionValue(option, defaultValue) {
    return _.get(data.get(this).options, option, defaultValue)
  }

  setOptions(options) {
    let obj = data.get(this);
    Object.assign(obj.options, options);
    data.set(this, obj);
  }

  setOptionValue(option, value) {
    let obj = data.get(this);
    _.set(obj.options, option, value);
    data.set(this, obj);
  }

  getOptionsBoolValue(option, defaultValue) {
    return !!this.getOptionValue(option, defaultValue)
  }

  getOptionsArrayValue(option, defaultValue) {
    let opt = this.getOptionValue(option, defaultValue);
    if (!Array.isArray(opt)) {
      return [opt];
    }
    return opt;
  }

  hasSchemaProp(prop) {
    return _.has(data.get(this), `schema.${prop}`)
  }

  hasSchemaPropKey(prop, key) {
    return _.has(data.get(this), `schema.${prop}.${key}`);
  }

  getSchema() {
    return _.cloneDeep(data.get(this).schema);
  }

  getSchemaPropsList() {
    return Object.keys(data.get(this).schema);
  }

  getSchemaPropValue(prop, key, defaultValue) {
    return _.get(data.get(this), `schema.${prop}.${key}`, defaultValue)
  }

  getSchemaPropBoolValue(prop, key, defaultValue) {
    return !!this.getSchemaPropValue(prop, key, defaultValue);
  }

  getSchemaPropArrayValue(prop, key, defaultValue) {
    let val = this.getSchemaPropValue(prop, key, defaultValue);
    if (_.isUndefined(val)) {
      return [];
    } else  if (!Array.isArray(val)) {
      return [val];
    }
    return val;
  }

  getSchemaPropFunctionValue(prop, key, defaultValue) {
    let val = this.getSchemaPropValue(prop, key, defaultValue);
    if (_.isFunction(val)) {
      return val;
    }
    return;
  }

  getVersion() {
    return data.get(this).version;
  }

  incVersion() {
    let obj = data.get(this);
    obj.version += 1;
    data.set(this, obj);
    return obj.version;
  }
}

module.exports = Storage;
