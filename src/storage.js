'use strict';

import get from 'lodash/fp/get';
import has from 'lodash/fp/has';
import set from 'lodash/fp/set';
import cloneDeep from 'lodash/fp/cloneDeep';

const store = new WeakMap();

const emptyFn = () => {
};

class Storage {
  /**
   * @param {{}} data
   */
  constructor(data = {}) {
    store.set(this, { data, version: 1 });
  }

  /**
   * @param {string} prop
   * @param {*} value
   * @return {Storage}
   */
  setValue(prop, value) {
    const obj = store.get(this);
    const data = set(prop, value, obj.data);
    // console.error('setValue::data', data);
    store.set(this, Object.assign(obj, { data, version: obj.version + 1 }));
    return this;
  }

  /**
   * @param {string} prop
   * @param {*=} defaultValue
   * @return {*}
   */
  getValue(prop, defaultValue) {
    const value = get(prop, store.get(this).data);
    return typeof value === 'undefined' ? defaultValue : value;
  }

  /**
   * @param {string} option
   * @param {boolean=} defaultValue
   * @return {boolean}
   */
  getBoolean(option, defaultValue) {
    return !!this.getValue(option, !!defaultValue)
  }

  /**
   * @param {string} prop
   * @return {boolean}
   */
  has(prop) {
    return has(prop, store.get(this).data);
  }

  /**
   * @return {string[]}
   */
  get keys() {
    return Object.keys(store.get(this).data);
  }

  /**
   * @param {string} key
   * @param {[]} defaultValue
   * @return {[]}
   */
  getArray(key, defaultValue = []) {
    let val = this.getValue(key, defaultValue);
    if (!Array.isArray(val)) {
      return [val];
    }
    return val;
  }

  /**
   * @param {string} key
   * @param {function=} defaultValue
   * @return {function}
   */
  getFunction(key, defaultValue = emptyFn) {
    let val = this.getValue(key, defaultValue);
    if (typeof val === 'function') {
      return val;
    }
    return emptyFn;
  }

  /**
   * @param {{}} data
   * @return {Storage}
   */
  replace(data) {
    store.set(this, Object.assign(store.get(this), { data }));
    return this;
  }

  get version() {
    return store.get(this).version;
  }

  get raw() {
    return cloneDeep(store.get(this).data);
  }
}

export default Storage;
