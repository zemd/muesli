'use strict';

import StringFilter from '../filters/string';
import NumberFilter from '../filters/number';
import IntegerFilter from '../filters/integer';
import ArrayFilter from '../filters/array';
import BooleanFilter from '../filters/boolean';

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
