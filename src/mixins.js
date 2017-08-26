'use strict';

import has from 'lodash/fp/has';
import get from 'lodash/fp/getOr'; // getOr(defaultValue, path, object)
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/combineLatest';
import 'rxjs/add/operator/startWith';

export const initGettersSetters = (model) => {
  const keys = Object.keys(model.props);
  const hasComputedFilterFn = (prop) => !has(`${prop}.computed`, model.props);

  const getters = model.propsSettings.useGetters ? keys : [];
  const setters = model.propsSettings.useSetters ? keys.filter(hasComputedFilterFn) : [];

  const values = {};
  const descriptors = {};

  getters.forEach((prop) => {
    descriptors[prop] = Object.assign({}, descriptors[prop], {
      get: () => {
        return model.get(prop);
      },
    });
  });

  setters.forEach((prop) => {
    descriptors[prop] = Object.assign({}, descriptors[prop], {
      set: (value) => {
        return model.set(prop, value);
      },
    });
  });

  Object.keys(descriptors)
    .forEach((prop) => {
      Object.defineProperty(values, prop, descriptors[prop]);
    });

  Object.defineProperty(model, 'values', {
    get: function () {
      return Object.freeze(values);
    },
  });
};

export const initComputedProps = (model) => {
  Object.keys(model.props)
    .filter((prop) => !!get([], `${prop}.computed`, model.props).length)
    .map((prop) => {
      let subjects = get([], `${prop}.computed`, model.props)
        .map((propToObserv) => model.subject(propToObserv).startWith(model.get(propToObserv)));

      return Observable.combineLatest(
        ...subjects
      )
        .subscribe((results) => {
          let oldValue = model.get(prop);
          model._values[prop] = results;
          model.publish(prop, model.get(prop), { oldValue });
        }, (error) => {
          throw error;
        });
    });
};
