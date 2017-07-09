# Muesli

Library for managing model data. It includes base class that you should inherit from.

[![npm version](https://badge.fury.io/js/muesli.svg)](https://www.npmjs.com/package/muesli)
[![Greenkeeper badge](https://badges.greenkeeper.io/zemd/muesli.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/zemd/muesli.svg?branch=master)](https://travis-ci.org/zemd/muesli)
[![Code Climate](https://codeclimate.com/github/zemd/muesli/badges/gpa.svg)](https://codeclimate.com/github/zemd/muesli)
[![CircleCI](https://circleci.com/gh/zemd/muesli/tree/master.svg?style=svg)](https://circleci.com/gh/zemd/muesli/tree/master)
[![dependencies:?](https://img.shields.io/david/zemd/muesli.svg)](https://david-dm.org/zemd/muesli)
[![devDependencies:?](https://img.shields.io/david/dev/zemd/muesli.svg?style=flat)](https://david-dm.org/zemd/muesli)
[![Inline docs](http://inch-ci.org/github/zemd/muesli.svg?branch=master)](http://inch-ci.org/github/zemd/muesli)

## Installation

```sh
npm install muesli
```

or

```sh
yarn add muesli
```

## Usage

Define your model type with simple inheritance

```javascript
import Model from 'muesli';
// or
// const Model = require('muesli');

class Book extends Model {
  constructor() {
    super({
      ISDN: {
        filter: String, // filters apply when you fetch the value, so you can rely on attribute's type
        value: '', // default value
        constraints: [constraints.required('validate-group')], // array of constraints that are used for validation of the model
        validate: function (value) {
          // use if for creating custom constraint during model definition
          // it can be async and return Promise or you might create done callback by using `const done = this.async();` 
        },
        json: {
          groups: ['serialization-group'],
        },
      },
      title: {
        filter: String,
      },
    }, {
      // Here you can override several options or put your own
      // all these values are used by default

      nameStrategy: 'camel', // currently affected only during json serialization for attributes' keys

      strict: false, // if true is set, then model won't accept non schema attributes. It won't throw an error
      throwOnStrictError: false, // if true it will throw an error when `strict` is true and you are trying to set non schema attribute
      
      returnEmptyValue: true, //
      
      provideGetters: true, // default to true -- give access to direct access to props via model.values object
      provideSetters: true, // default to true

      validators: [ // model validators that can validate all object's values
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

### fromJSON and toJSON

```javascript
  class Author extends Model {
    constructor() {
      super({
        name: {
          filter: 'string',
          constraints: [constrains.required()]
        },
        lastName: {
          filter: 'string'
        }
      });
    }
  }
  const horror = Author.fromJSON({
    name: 'Stephen',
    lastName: 'King'
  });
  
  // horror instanceof Author => true
   
   console.log(horror.toJSON());
   // {name: "Stephen", lastName: "King"}
```

### Using `provideGetters` and `provideSetters` options

if `provideGetters` and `provideSetters` options are set to `true`, then you can use props' values directly via 
`model.values` object.

Example:
```javascript
  class Author extends Model {
    constructor() {
      super({
        name: {
          filter: 'string',
          value: 'Default value'
        },
        age: {
          filter: 'number'
        }
      });
    }
  }
  
  const model = new Author();
  console.log(model.values.name); // outputs: 'Default value'
  console.log(model.values.age); // outputs: 0
  
  // or you can use setter
  model.values.age = 30;
  console.log(model.values.age); // outputs: 30
```

`model.values` object can't be extended. only props from defined schema are available. Setters won't be provided for 
computed properties.  

### Model version

If you want to use mutable version of the model, you can check if models are not equal by comparing their versions.

```javascript
  const model = Model.fromJSON({name: 'Stephen'});
  console.log(model.version); // output: 2
  model.set('name', 'Dmitry');
  console.log(model.version); // output: 3
```

## License

Muesli is released under the MIT license.

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
[![](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/red_rabbit)
