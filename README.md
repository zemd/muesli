# Muesli

Library for managing model data. It includes base class that you should inherit from.

[![npm version](https://badge.fury.io/js/muesli.svg)](https://www.npmjs.com/package/muesli)
[![Build Status](https://travis-ci.org/zemd/muesli.svg?branch=master)](https://travis-ci.org/zemd/muesli)
[![Code Climate](https://codeclimate.com/github/zemd/muesli/badges/gpa.svg)](https://codeclimate.com/github/zemd/muesli)
[![CircleCI](https://circleci.com/gh/zemd/muesli/tree/master.svg?style=svg)](https://circleci.com/gh/zemd/muesli/tree/master)
[![dependencies:?](https://img.shields.io/david/zemd/muesli.svg)](https://david-dm.org/zemd/muesli)
[![devDependencies:?](https://img.shields.io/david/dev/zemd/muesli.svg?style=flat)](https://david-dm.org/zemd/muesli)

## Installation

```sh
npm install muesli
```

or

```sh
yarn add muesli
```

## Usage

Define you model type with simple inheritance

```javascript
class Book extends BaseModel {
  constructor() {
    super({
      ISDN: {
        filter: String, // filters are applies when you fetch the value, so you can rely on it's eventual type
        value: '', // default value
        constraints: [constraints.required('validate-group')], // array of constraints that are used for validation of the model
        validate: function (value) {
          // use if for creating custom constraint during model definition
        },
        json: {
          groups: ['serialization-group']
        }
      },
      title: {
        filter: String
      }
    }, {
      // Here you can override several options or put your own

      nameStrategy: 'camel', // currently affected only during json serialization for attributes' keys

      strict: true, // if true is set, then model won't accept non schema attributes and will throw an error

      validators: [ // model validators that validate whole object's values
        validators.equalPasswords('validation-group1'),
        validators.validDates('validation-group2')
      ]
    });
  }
}

let book1 = new Book();
book1.set('ISDN', '1232412-123');
// Using rxjs observable
book1.validate()
  .subscribe((results) => {
    if (results.length) {
      // model invalid
      // results array contains ConstraintError and/or ValidatorError with details of failure
    } else {
      // model is valid
    }
  }, err => {
    // there were errors during validation process
    console.error(err);
  });


let book2 = new Book();
book2.set('ISDN', '32131231-434');
// Using standard callback style
book2.validate('group1', (err, results) => {
  if (err) {
    console.error(there were errors during validation process);
  }
  if (results.length) {
    // model invalid
    // results array contains ConstraintError and/or ValidatorError with details of failure
  } else {
    // model is valid
  }
});
```

### Computed values

```javascript
  const mymodel = new Model({
    firstName: {
      filter: String,
      value: 'Dmitry'
    },
    lastName: {
      filter: String
    },
    fullName: {
      filter: function (deps = []) {
        return deps.join(' ')
      },
      computed: ['firstName', 'lastName']
    }
  });

  console.log(myModel.get('fullName')); // output -> 'Dmitry '
  myModel.set('lastName', 'Zelenetskiy');
  console.log(myModel.get('fullName')); // output -> 'Dmitry Zelenetskiy'
```

## Usage in browser

Use browserify or any other tool that can convert `require` loader into desired state.

## License

Muesli is released under the MIT license.

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
[![](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/red_rabbit)
