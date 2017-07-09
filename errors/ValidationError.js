'use strict';

export default class ValidationError extends Error {
  /**
   * @param {string} tag [Required]
   * @param {string} group
   */
  constructor(tag, group) {
    super();

    this.statusCode = 422;
    this.tag = tag;
    this.group = group;
  }
}

