'use strict';

export default class ValidateError extends Error {
  constructor(props, message) {
    super(message);

    this.props = props;
  }
}
