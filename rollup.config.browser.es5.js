'use strict';

const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

export default [{
  entry: './src/model.js',
  dest: './es5/umd/model.js',
  format: 'umd',
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
  ],
  globals: {
    ['rxjs/Observable']: 'Observable',
    ['rx-emitter']: 'Emitter',
  },
  interop: false,
  moduleName: 'muesli',
  plugins: [
    nodeResolve({
      module: true,
      jsnext: true,
      main: true,
    }),
    commonjs(),
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
  dest: './es5/umd/errors/ConstraintError.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'ConstraintError',
  plugins: [
    nodeResolve({
      module: true,
      jsnext: true,
      main: true,
    }),
    commonjs(),
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
  entry: './errors/ValidateError.js',
  dest: './es5/umd/errors/ValidateError.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'ValidateError',
  plugins: [
    nodeResolve({
      module: true,
      jsnext: true,
      main: true,
    }),
    commonjs(),
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
