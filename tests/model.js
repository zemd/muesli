'use strict';

import test from 'ava';
import BaseModel from '../';
import _ from 'lodash';
import ConstraintError from '../errors/ConstraintError';
import ValidatorError from '../errors/ValidatorError';
import required from '../constraints/required';
import { equalPasswords } from './utils/validators';

test('Default options', t => {
  t.plan(8);

  let inst = new BaseModel();

  t.false(inst.getOption('strict'));
  t.false(inst.getOption('throwOnStrictError'));
  t.true(inst.getOption('returnEmptyValue'));
  t.true(inst.getOption('useGetters'));
  t.true(inst.getOption('useSetters'));
  t.true(Array.isArray(inst.getOption('validators')));
  t.is(inst.getOption('validators').length, 0);
  t.is(inst.getOption('nameStrategy'), 'camel');
});

test('setOption/getOption', t => {
  t.plan(2);
  let inst = new BaseModel();

  t.false(inst.getOption('strict'));
  inst.setOption('strict', true);
  t.true(inst.getOption('strict'));
});

test('Setting values for properties defined in schema', t => {
  t.plan(4);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
    },
    lastName: {
      filter: 'string',
    },
  });

  t.is(inst.get('firstName'), '');
  t.is(inst.get('lastName'), '');

  inst.set('firstName', 'Dmytro');
  inst.set('lastName', 'Zelenetskyi');

  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName'), 'Zelenetskyi');
});

test('Setting values for custom attributes which were not defined in schema. strict mode disabled', t => {
  t.plan(6);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
    },
    lastName: {
      filter: String,
    },
  });

  t.is(inst.get('firstName'), '');
  t.is(inst.get('lastName'), '');

  inst.set('lastName', 'Zelenetskyi');
  inst.set('fullName', 'Dmytro Zelenetskyi');

  t.is(inst.get('firstName'), '');
  t.is(inst.get('lastName'), 'Zelenetskyi');
  t.is(inst.get('fullName'), 'Dmytro Zelenetskyi');
  t.is(inst.get('randomProp'), undefined, `Unknown property must be undefined`)
});

test('Setting values for custom attributes which were not defined in schema. strict mode enabled and throwOnStrictError disabled', t => {
  t.plan(2);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
    }
  }, {
    strict: true,
  });

  inst.set('firstName', 'Dmytro');
  inst.set('lastName', 'Zelenetskiy');

  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName', undefined));
});

test('Setting values for custom attributes which were not defined in schema. strict mode enabled and throwOnStrictError enabled', t => {
  t.plan(3);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
    }
  }, {
    strict: true,
    throwOnStrictError: true,
  });

  inst.set('firstName', 'Dmytro');

  t.throws(() => {
    inst.set('lastName', 'Zelenetskiy');
  });
  t.is(inst.get('firstName'), 'Dmytro');
  t.is(inst.get('lastName'), undefined);
});

test('Model must return values with correct types due to their filters', t => {
  t.plan(3);

  let instance = new BaseModel({
    firstName: {
      filter: 'string',
      value: 123
    },
    lastName: {
      filter: String,
      value: true
    }
  });

  t.is(typeof instance.get('firstName'), 'string');
  t.is(typeof instance.get('lastName'), 'string');

  instance.set('firstName', {});
  t.is(instance.get('firstName'), '[object Object]');
});

test.cb('Validate 1 constraint with default group and fail with ConstraintError', t => {
  t.plan(7);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      constraints: [required()],
    },
  });

  inst.validatePropsConstraints()
    .subscribe((results) => {
      let err = _.head(results);

      t.is(results.length, 1);
      t.true(err instanceof ConstraintError);
      t.is(err.statusCode, 422);
      t.is(err.propertyValue, '');
      t.is(err.propertyName, 'firstName');
      t.is(err.group, BaseModel.DEFAULT_GROUP);
      t.is(err.tag, 'required');

      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate 1 constraint with default group and succeed', t => {
  t.plan(1);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      value: 'Dmitry',
      constraints: [required()]
    }
  });

  inst.validatePropsConstraints()
    .subscribe((results) => {
      t.is(results.length, 0);
      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate 1 constraint with custom group and succeed', t => {
  t.plan(1);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      value: 'Dmitry',
      constraints: [required(['group1'])]
    }
  });

  inst.validatePropsConstraints('custom')
    .subscribe((results) => {
      t.is(results.length, 0);
      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate only that constraint that was defined in argument', t => {
  t.plan(7);

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      constraints: [required(['group1']), required(['group2'])]
    }
  });

  inst.validatePropsConstraints('group2')
    .subscribe((results) => {
      let err = _.head(results);

      t.is(results.length, 1);
      t.true(err instanceof ConstraintError);
      t.is(err.statusCode, 422);
      t.is(err.propertyValue, '');
      t.is(err.propertyName, 'firstName');
      t.is(err.group, 'group2');
      t.is(err.tag, 'required');

      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test.cb('Validate 1 model validator with default group and fail with ValidatorError', t => {
  t.plan(8);

  let inst = new BaseModel({
    firstName: {
      filter: String,
      value: 'Dmitry'
    },
    lastName: {
      filter: String,
      value: 'Zelenetskiy'
    }
  }, {
    validators: [
      equalPasswords()
    ]
  });

  inst.validateModelValidators()
    .subscribe((results) => {
      let err = _.head(results);

      t.true(Array.isArray(results));
      t.is(results.length, 1);

      t.true(err instanceof ValidatorError);
      t.is(err.statusCode, 422);
      t.is(err.propertyValue, undefined);
      t.is(err.propertyName, undefined);
      t.is(err.group, BaseModel.DEFAULT_GROUP);
      t.is(err.tag, 'equalPasswords');


      t.end();
    }, (err) => {
      t.fail(err.message);
    });
});

test('toJSON changing nameStrategy dynamically and using different groups', t => {
  t.plan(4);

  let inst = new BaseModel({
    firstName: {
      value: 'Dmitry',

      json: {
        groups: ['group1']
      }
    },
    lastName: {
      value: 'Zelenetskiy',

      json: {
        hidden: true
      }
    },
    age: {
      filter: 'integer',
      value: 10,

      json: {
        groups: ['group2']
      }
    }
  });

  t.deepEqual(inst.toJSON(), { firstName: 'Dmitry', age: 10 });
  inst.setOption('nameStrategy', 'snake');
  t.deepEqual(inst.toJSON(), { first_name: 'Dmitry', age: 10 });

  inst.setOption('nameStrategy', 'camel');
  t.deepEqual(inst.toJSON('group1'), { firstName: 'Dmitry' });
  t.deepEqual(inst.toJSON('group2'), { age: 10 });
});

test('fromJSON creates valid Model object in non strict mode', t => {
  t.plan(3);

  class MyModel extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          constraints: [required()]
        },
        lastName: {
          filter: String
        }
      })
    }
  }

  const inst = MyModel.fromJSON({
    firstName: 'Dmitry',
    lastName: 'Zelenetskiy',
    age: 30
  });

  t.is(inst.get('firstName'), 'Dmitry');
  t.is(inst.get('lastName'), 'Zelenetskiy');
  t.is(inst.get('age'), 30);
});

test('fromJSON creates valid Model object with skipping invalid props in strict mode', t => {
  t.plan(3);

  class MyModel extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          constraints: [required()]
        },
        lastName: {
          filter: String
        }
      }, {
        strict: true
      })
    }
  }

  const inst = MyModel.fromJSON({
    firstName: 'Dmitry',
    lastName: 'Zelenetskiy',
    age: 30
  });

  t.is(inst.get('firstName'), 'Dmitry');
  t.is(inst.get('lastName'), 'Zelenetskiy');
  t.is(inst.get('age'), undefined);
});

test('fromJSON throws an error when Model configured with strict mode and throwOnStrictError enabled', t => {
  t.plan(1);

  class MyModel extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          constraints: [required()],
        },
        lastName: {
          filter: String,
        },
      }, {
        strict: true,
        throwOnStrictError: true,
      });
    }
  }

  t.throws(function () {
    MyModel.fromJSON({
      firstName: 'Dmitry',
      lastName: 'Zelenetskiy',
      age: 30,
    });
  });
});

test('Computed properties', t => {
  t.plan(6);

  const inst = new BaseModel({
    firstName: {
      filter: String,
      value: 'Dmitry',
    },
    lastName: {
      filter: String,
    },
    fullName: {
      filter: function (deps = []) {
        return deps.join(' ')
      },
      computed: ['firstName', 'lastName']
    },
  });

  t.is(inst.get('firstName'), 'Dmitry');
  t.is(inst.get('lastName'), '');
  t.is(inst.get('fullName'), 'Dmitry ');

  inst.set('lastName', 'Zelenetskiy');

  t.is(inst.get('fullName'), 'Dmitry Zelenetskiy');

  inst.set('lastName', 'Zelenetskiy2');
  t.is(inst.get('fullName'), 'Dmitry Zelenetskiy2');

  t.throws(function () {
    inst.set('fullName', 'Bill Gates');
  })
});

// test('Immutable model', t => {
//   t.plan(9);
//
//   class Author extends BaseModel {
//     constructor() {
//       super({
//         firstName: {
//           filter: String,
//           value: 'Default Name'
//         },
//         lastName: {
//           filter: String
//         }
//       }, {
//         immutable: true
//       });
//     }
//   }
//
//   const inst = Author.fromJSON({ firstName: 'Dmitry' });
//   const newInst = inst.set('lastName', 'Zelenetskiy');
//
//   t.true(inst.getOption('immutable'));
//   t.true(newInst.getOption('immutable'));
//
//   t.is(inst.get('firstName'), 'Dmitry');
//   t.is(inst.get('lastName'), '');
//
//   t.false(newInst === inst);
//   t.true(inst instanceof Author);
//   t.true(newInst instanceof Author);
//
//   t.is(newInst.get('firstName'), 'Dmitry');
//   t.is(newInst.get('lastName'), 'Zelenetskiy');
// });

test('provideGetters and provideSetters', t => {
  t.plan(4);

  class Author extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          value: 'Default Name'
        },
        lastName: {
          filter: String,
        },
        fullName: {
          filter: function (deps = []) {
            return deps.join(' ');
          },
          computed: ['firstName', 'lastName']
        },
      });
    }
  }

  const inst = Author.fromJSON({ firstName: 'Dmitry' });
  t.is(inst.values.firstName, 'Dmitry');

  inst.values.lastName = 'Zelenetskiy';
  t.is(inst.values.lastName, 'Zelenetskiy');

  t.is(inst.values.fullName, 'Dmitry Zelenetskiy');
  t.throws(() => {
    inst.values.fullName = 'Custom Name';
  });
});

test('version', t => {
  t.plan(2);

  class Author extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          value: 'Default Name',
        },
        lastName: {
          filter: String,
        },
      });
    }
  }

  const inst = Author.fromJSON({ firstName: 'Dmitry' });
  let version = inst.version;
  t.true(inst.version > 0);

  inst.set('lastName', 'Zelenetskiy');
  t.is(inst.version, ++version);
});

test('toJSON with nested models', t => {
  class FirstName extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          value: 'Dmitry',
        },
      });
    }
  }

  class Author extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: (v) => FirstName.fromJSON(v),
        },
        lastName: {
          filter: String,
          value: 'Zelenetskiy',
        },
      });
    }
  }

  const inst = new Author();
  const json = inst.toJSON();

  t.deepEqual(json, { lastName: 'Zelenetskiy', firstName: { firstName: 'Dmitry' } });
});
