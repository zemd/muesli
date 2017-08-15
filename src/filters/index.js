'use strict';

import StringFilter from './string';
import NumberFilter from './number';
import IntegerFilter from './integer';
import ArrayFilter from './array';
import BooleanFilter from './boolean';

export default {
  string: StringFilter,
  number: NumberFilter,
  integer: IntegerFilter,
  array: ArrayFilter,
  boolean: BooleanFilter,
  [String.toString()]: StringFilter,
  [Number.toString()]: NumberFilter,
  [Array.toString()]: ArrayFilter,
  [Boolean.toString()]: BooleanFilter,
};
