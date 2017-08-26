'use strict';

import FILTERS from './filters/index';

export const DEFAULT_GROUP = 'default';

/**
 * @param {{}} schema
 * @return {{}}
 */
export const extractDefaultValues = (schema = {}) => {
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

/**
 * @param {string|function} filter
 * @return {function}
 */
export const extractFilter = (filter) => {
  if (FILTERS[`${filter}`]) {
    return FILTERS[filter];
  } else if (typeof filter === 'function') {
    return filter;
  }
  throw new Error(`No filter defined with ${filter} name`);
};

/**
 * @param {{}} props
 * @param {string} group
 * @return {{}}
 */
export const filterConstraints = (props, group = DEFAULT_GROUP) => {
  const filterGroup = (constraint) => {
    if (typeof constraint !== 'function') {
      return false;
    }

    if (Array.isArray(constraint.groups)) {
      if (constraint.groups.length === 0) {
        return true;
      }
      return constraint.groups.includes(group);
    }

    return true;
  };

  return Object.keys(props)
    .reduce((acc, item) => {
      acc[item] = props[item].filter(filterGroup);
      return acc;
    }, {});
};
