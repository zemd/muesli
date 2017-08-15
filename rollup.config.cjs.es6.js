'use strict';

const path = require('path');

export default [{
  entry: './src/model.js',
  dest: './es6/common/model.js',
  format: 'cjs',
  external: [
    'rxjs/Observable',
    'rxjs/add/observable/combineLatest',
    'rxjs/add/observable/forkJoin',
    'rxjs/add/operator/startWith',
    'rxjs/add/observable/fromPromise',
    'rxjs/add/observable/of',
    'rxjs/add/observable/throw',
    'rxjs/add/operator/catch',
    'rxjs/add/operator/filter',
    'rxjs/add/operator/map',
    'run-async',
    'change-case',
    'lodash/fp/flatten',
    'lodash/fp/difference',
    'lodash/fp/toSafeInteger',
    'lodash/fp/get',
    'lodash/fp/getOr',
    'lodash/fp/has',
    'lodash/fp/set',
    'lodash/fp/cloneDeep',
    'rx-emitter',
    path.resolve('./errors/ValidateError.js'),
    path.resolve('./errors/ConstraintError.js'),
  ],
  interop: false,
  preferConst: true,
}, {
  entry: './errors/ConstraintError.js',
  dest: './es6/common/errors/ConstraintError.js',
  format: 'cjs',
  interop: false,
}, {
  entry: './errors/ValidateError.js',
  dest: './es6/common/errors/ValidateError.js',
  format: 'cjs',
  interop: false,
}];
