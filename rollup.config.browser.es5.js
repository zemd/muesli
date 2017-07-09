'use strict';

const babel = require('rollup-plugin-babel');
const nodeResolve = require('rollup-plugin-node-resolve');
const commonjs = require('rollup-plugin-commonjs');

export default [{
  entry: './index.js',
  dest: './es5/umd/index.js',
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
  entry: './errors/ValidationError.js',
  dest: './es5/umd/errors/ValidationError.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'ValidationError',
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
  entry: './errors/ValidatorError.js',
  dest: './es5/umd/errors/ValidatorError.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'ValidatorError',
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
  entry: './filters/array.js',
  dest: './es5/umd/filters/array.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'array',
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
  entry: './filters/boolean.js',
  dest: './es5/umd/filters/boolean.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'boolean',
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
  entry: './filters/integer.js',
  dest: './es5/umd/filters/integer.js',
  format: 'umd',
  external: [
    'lodash/fp/toSafeInteger',
  ],
  globals: {},
  interop: false,
  moduleName: 'integer',
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
  entry: './filters/number.js',
  dest: './es5/umd/filters/number.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'number',
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
  entry: './filters/string.js',
  dest: './es5/umd/filters/string.js',
  format: 'umd',
  external: [],
  globals: {},
  interop: false,
  moduleName: 'string',
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
