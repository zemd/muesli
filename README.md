# Muesli

> Simple, ORM-agnostic domain driven model management

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

### Optional packages

```bash
npm install muesli-filters
npm install muesli-validators
npm install muesli-constraints
```

## Usage

### Import `Model` class from `muesli` package.

```js
import Model from 'muesli';
// or
const Model = require('muesli');
```

### Define your model's props

```js
class Book extends Model {
  
}
Book.props = {
  ISDN: {
    filter: 'string',
    value: '',
    constraints: [],
    validate: (value) => {},
    json: {},
  },
  title: {
    filter: 'string',
  },
  author: {
    filter: (value) => Author.fromJSON(value),
  },
  reference: {
    filter: (ref) => CustomModelStore.findByRef(ref),
  },
};
```

### Add settings for your model

```js
class Book extends Model {
  
}
Book.propsSettings = {
  nameStrategy: 'camel', // currently affected only during json serialization for attributes' keys
  
  strict: false, // if true is set, then model won't accept non schema attributes. It won't throw an error
  throwOnStrictError: false, // if true it will throw an error when `strict` is true and you are trying to set non schema attribute
  
  provideGetters: true, // default to true -- give access to direct access to props via model.values object
  provideSetters: true, // default to true

  validators: [ // model validators that can validate all object's values
    MuesliValidators.equalProps(['password', 'password-confirmation'], ['validation-group1']),
    MuesliValidators.validDates(['birthdate'], 'validation-group2')
  ]
};
```

| Setting name | Default value | Possible values | Description |
|---|---|---|---|
| nameStrategy | `<empty string>`  | `(camel|pascal|title|snake|lower|upper|constant)` | Props names' serialization strategy. Look inside package https://www.npmjs.com/package/change-case |
| strict | `false` | `true|false` | if `true` is set, then model won't accept non schema props. |
| throwOnStrictError | `false` | `true|false` | if `true` is set and `strict === true`, model will throw an error when model tries to set non schema prop |
| provideGetters | `true` | `true|false` | gives direct access to props values via `model.values` object |
| provideSetters | `true` | `true|false` | |
| validators | `[]` | | array of model validators that can validate through whole model |

### Model validation

```js
const book = Book.fromJSON({ ISDN: '1232412-123' });

book.validate()
  .then((validationErrors) => {
    if (validationErrors.length) {
      // Model doesn't pass validation constraints
    } else {
      // everything is good
    }
  })
  .catch((error) => {
    // FATAL errors occurred during validation process
    console.error(error);
  });
```

There is static method to make the same operation quicker

```js
Book.validate({ ISDN: '12345123-123' })
  .then((validationErrors) => {
    if (validationErrors.length) {
      // Model doesn't pass validation constraints
    } else {
      // everything is good
    }
  })
  .catch((error) => {
    // FATAL errors occurred during validation process
    console.error(error);
  });
```

You can also validate only part of the model using `validation group`

```js
book.validate(['group1'])
  .then((validationErrors) => {
    if (validationErrors.length) {
      // Model doesn't pass validation constraints
    } else {
      // everything is good
    }
  })
  .catch((error) => {
    // FATAL errors occurred during validation process
    console.error(error);
  });
```

### Custom constraints and validators

Constraints and validators are **asynchronous** by default, but you not required to use `Promises` if you don't need to.

```js
const customConstraint = (groups = []) => {
  return (propValue, propName, currentGroup) => {
    return new Promise((resolve, reject) => {
      if (!groups.includes(currentGroup)) {
        // It is very important that you handle validation groups inside custom constraint 
        resolve();
        return;
      }
      if (propValue !== 'custom value') {
        reject(new Error(`${propName} must be equals 'custom value'`));
        return;
      }
      resolve();
    });
  };
};
```

```js
const customValidator = (groups = []) => {
  return (values, currentGroup) => {
    if (!groups.includes(currentGroup)) {
      // It is very important that you handle validation groups inside custom constraint 
      return;
    }
    if (values.password !== values.password_confirmation) {
      throw new Error('Password and password confirmation must be equal');
    }
    // You don't need to return anything if everything is fine
  };
};
```

### Computed props

```javascript
class Author extends Model {}
Author.props = {
  firstName: {
    filter: String,
    value: 'Dmytro',
  },
  lastName: {
    filter: String,
  },
  fullName: {
    filter: function (deps = []) {
      return deps.filter((v) => v).join(' ');
    },
    computed: ['firstName', 'lastName'],
  },
};
const author = new Author();

console.log(author.get('fullName')); // output -> 'Dmytro'
author.set('lastName', 'Zelenetskyi');
console.log(author.get('fullName')); // output -> 'Dmytro Zelenetskyi'
```

### Deserializing and serializing model(fromJSON/toJSON)

```javascript
class Author extends Model {}

Author.props = {
 name: {
   filter: 'string',
   constraints: [MusliConstraints.required()],
 },
 lastName: {
   filter: 'string',
 },
}; 

const horror = Author.fromJSON({
  name: 'Stephen',
  lastName: 'King',
});
console.log(horror instanceof Author);
// outputs `true`
 
console.log(horror.toJSON());
// outputs `{ name: "Stephen", lastName: "King" }`
```

### Using `provideGetters` and `provideSetters` options

if `provideGetters` or/and `provideSetters` options are set to `true`, 
then you can use props' values directly via `model.values` object.

Example:
```js
class Author extends Model {}
Author.props = {
 name: {
   filter: 'string',
   value: 'Default value',
 },
 age: {
   filter: 'number',
   value: 0,
 },
};
Author.propsSettings = {
  provideGetters: true,
  provideSetters: true,
};

const model = new Author();
console.log(model.values.name); // outputs: 'Default value'
console.log(model.values.age); // outputs: 0

// or you can use setter
model.values.age = 30;
console.log(model.values.age); // outputs: 30
```

`model.values` object can't be extended. Only props from schema are available. Setters won't be provided for 
computed properties.

### Model version

With each model mutation model increases it's version, so you can track it.

```js
const author = Author.fromJSON({ name: 'Stephen' });
console.log(model.version); // output: 1
model.set('name', 'Dmytro');
console.log(model.version); // output: 2
```

### Creating ORM-like entities

```js
const pg = require('pg');
const SQL = require('sql-template-strings')

class Entity extends Model {
  static get source() {
    throw new Error('Implement me');
  }
  
  static async findById(id) {
    const rows = await pool.query(SQL`SELECT * FROM "`.append(this.source).append(SQL`" WHERE id=${id}`));
    return this.fromJSON(rows[0]);
  }
}

class UserEntity extends Entity {
  static get source() {
    return 'users';
  }
  
  static get props() {
    return {
      first_name: {
        filter: 'string',
      },
      last_name: {
        filter: 'string',
      },
      password: {
        filter: 'string',
      },
    };
  }
}

const user = UserEntity.findById(1);
console.log(user.get('first_name'));
console.log(user.values);
```

### Events

Model inherits event system from `rx-emitter`([github link](https://github.com/zemd/rx-emitter)) package that uses `rxjs` and handles all events as observables.

```js
const book = new Book();

Rx.Observable.combineLatest(
  book.subject('chapter1'),
  book.subject('chapter2'),
)
.subscribe(() => {
  console.log('Two first chapters are ready');
});

book.publish('chapter1');
book.publish('chapter2');
```

## License

Muesli is released under the MIT license.

## Donate

[![](https://img.shields.io/badge/patreon-donate-yellow.svg)](https://www.patreon.com/red_rabbit)
[![](https://img.shields.io/badge/flattr-donate-yellow.svg)](https://flattr.com/profile/red_rabbit)
