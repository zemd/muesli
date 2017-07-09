'use strict';

const babel = require('rollup-plugin-babel');
const path = require('path');

export default [{
  entry: './index.js',
  dest: './es5/common/index.js',
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
    'lodash/fp/has',
    'lodash/fp/set',
    'lodash/fp/cloneDeep',
    'rx-emitter',
    path.resolve('./errors/ValidationError.js'),
    path.resolve('./errors/Validator.js'),
    path.resolve('./errors/ConstraintError.js'),
    path.resolve('./filters/array.js'),
    path.resolve('./filters/boolean.js'),
    path.resolve('./filters/integer.js'),
    path.resolve('./filters/number.js'),
    path.resolve('./filters/string.js'),
  ],
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './errors/ConstraintError.js',
  dest: './es5/common/errors/ConstraintError.js',
  format: 'cjs',
  external: [
    path.resolve('./errors/ValidationError.js'),
    path.resolve('./errors/Validator.js'),
  ],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './errors/ValidationError.js',
  dest: './es5/common/errors/ValidationError.js',
  format: 'cjs',
  external: [
    path.resolve('./errors/ValidationError.js'),
    path.resolve('./errors/Validator.js'),
  ],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './errors/ValidatorError.js',
  dest: './es5/common/errors/ValidatorError.js',
  format: 'cjs',
  external: [
    path.resolve('./errors/ValidationError.js'),
    path.resolve('./errors/Validator.js'),
  ],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './filters/array.js',
  dest: './es5/common/filters/array.js',
  format: 'cjs',
  external: [],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './filters/boolean.js',
  dest: './es5/common/filters/boolean.js',
  format: 'cjs',
  external: [],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './filters/integer.js',
  dest: './es5/common/filters/integer.js',
  format: 'cjs',
  external: [
    'lodash/fp/toSafeInteger',
  ],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './filters/number.js',
  dest: './es5/common/filters/number.js',
  format: 'cjs',
  external: [],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}, {
  entry: './filters/string.js',
  dest: './es5/common/filters/string.js',
  format: 'cjs',
  external: [],
  globals: {},
  interop: false,
  plugins: [
    babel({
      presets: [
        ['es2015', { modules: false }],
      ],
      plugins: [
        'external-helpers',
      ],
    }),
  ],
}];
