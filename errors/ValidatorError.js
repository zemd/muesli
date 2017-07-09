'use strict';

import ValidationError from './ValidationError';

export default class ValidatorError extends ValidationError {
  constructor(props, tag, group) {
    super(tag, group);

    this.props = props;
  }
}
