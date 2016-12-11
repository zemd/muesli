'use strict';

const test = require('ava');
const BaseModel = require('../src/model');
const _ = require('lodash');
const errors = require('../src/lib/errors');

test('Default options', t => {
  t.plan(3);

  let inst = new BaseModel();

  t.false(inst.getOption('strict'));
  t.true(inst.getOption('returnEmptyValue'));
  t.is(inst.getOption('nameStrategy'), 'camel');
});

test('setOption/getOption', t => {
  t.plan(2);
  let inst = new BaseModel();

  t.false(inst.getOption('strict'));
  inst.setOption('strict', true);
  t.true(inst.getOption('strict'));
});

test('Get/Set methods in non strict mode and default options', t => {
  t.plan(4);

  let instance = new BaseModel({
    firstName: {
      filter: 'string'
    },
    lastName: {
      filter: String
    }
  });

  instance.set('lastName', 'Zelenetskiy');
  instance.set('fullName', 'Dmitry Zelenetskiy');

  t.is(instance.get('lastName'), 'Zelenetskiy', `Property didn't change it's value after set was called`);
  t.is(instance.get('firstName'), '', `Default value must be returned id no set was called`);
  t.is(instance.get('fullName'), 'Dmitry Zelenetskiy', `Undefined attribute must be set in non strict mode`);
  t.is(instance.get('randomProp'), undefined, `Unknown property must be undefined`)
});

test('Get/Set methods in strict mode and default options', t => {
  t.plan(2);

  let instance = new BaseModel({
    firstName: {
      filter: 'string'
    }
  }, {
    strict: true
  });

  instance.set('firstName', 'Dmitry');

  t.throws(function () {
    instance.set('lastName', 'Zelenetskiy');
  });
  t.is(instance.get('firstName'), 'Dmitry');
});

test('Model must filter wrong typed values', t => {
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

  t.is(typeof instance.get('firstName'), 'string', `string filter didn't applied for number default value`);
  t.is(typeof instance.get('lastName'), 'string', `String filter didn't applied for boolean default value`);

  instance.set('firstName', {});
  t.is(instance.get('firstName'), '[object Object]');
});

test.cb('Validate 1 constraint with default group and fail with ConstraintError', t => {
  t.plan(7);

  const constraints = require('../src/lib/constraints');

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      constraints: [constraints.required()]
    }
  });

  inst.validatePropsConstraints()
    .subscribe((results) => {
      let err = _.head(results);

      t.is(results.length, 1);
      t.true(err instanceof errors.ConstraintError);
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

  const constraints = require('../src/lib/constraints');

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      value: 'Dmitry',
      constraints: [constraints.required()]
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

  const constraints = require('../src/lib/constraints');

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      value: 'Dmitry',
      constraints: [constraints.required(['group1'])]
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

  const constraints = require('../src/lib/constraints');

  let inst = new BaseModel({
    firstName: {
      filter: 'string',
      constraints: [constraints.required(['group1']), constraints.required(['group2'])]
    }
  });

  inst.validatePropsConstraints('group2')
    .subscribe((results) => {
      let err = _.head(results);

      t.is(results.length, 1);
      t.true(err instanceof errors.ConstraintError);
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

  const validators = require('./utils/validators');

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
      validators.equalPasswords()
    ]
  });

  inst.validateModelValidators()
    .subscribe((results) => {
      let err = _.head(results);

      t.true(Array.isArray(results));
      t.is(results.length, 1);

      t.true(err instanceof errors.ValidatorError);
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

  t.deepEqual(inst.toJSON(), {firstName: 'Dmitry', age: 10});
  inst.setOption('nameStrategy', 'snake');
  t.deepEqual(inst.toJSON(), {first_name: 'Dmitry', age: 10});

  inst.setOption('nameStrategy', 'camel');
  t.deepEqual(inst.toJSON('group1'), {firstName: 'Dmitry'});
  t.deepEqual(inst.toJSON('group2'), {age: 10});
});

test('fromJSON creates valid Model object in non strict mode', t => {
  t.plan(3);

  const constraints = require('../src/lib/constraints');
  class MyModel extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          constraints: [constraints.required()]
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

  const constraints = require('../src/lib/constraints');
  class MyModel extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          constraints: [constraints.required()]
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
  t.is(inst.get('age'), undefined)
});

test('fromJSON will throw an error when not defined prop is coming in strict mode', t => {
  t.plan(1);

  const constraints = require('../src/lib/constraints');
  class MyModel extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          constraints: [constraints.required()]
        },
        lastName: {
          filter: String
        }
      }, {
        strict: true
      })
    }
  }

  t.throws(function () {
    MyModel.fromJSON({
      firstName: 'Dmitry',
      lastName: 'Zelenetskiy',
      age: 30
    }, false)
  });
});

test('Computed properties', t => {
  t.plan(6);

  const inst = new BaseModel({
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

test('Immutable model', t => {
  t.plan(9);

  class Author extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          value: 'Default Name'
        },
        lastName: {
          filter: String
        }
      }, {
        immutable: true
      });
    }
  }

  const inst = Author.fromJSON({firstName: 'Dmitry'});
  const newInst = inst.set('lastName', 'Zelenetskiy');

  t.true(inst.getOption('immutable'));
  t.true(newInst.getOption('immutable'));

  t.is(inst.get('firstName'), 'Dmitry');
  t.is(inst.get('lastName'), '');

  t.false(newInst === inst);
  t.true(inst instanceof Author);
  t.true(newInst instanceof Author);

  t.is(newInst.get('firstName'), 'Dmitry');
  t.is(newInst.get('lastName'), 'Zelenetskiy');
});

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
          filter: String
        },
        fullName: {
          filter: function (deps = []) {
            return deps.join(' ');
          },
          computed: ['firstName', 'lastName']
        }
      });
    }
  }

  const inst = Author.fromJSON({firstName: 'Dmitry'});
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
          value: 'Default Name'
        },
        lastName: {
          filter: String
        }
      });
    }
  }

  const inst = Author.fromJSON({firstName: 'Dmitry'});
  let version = inst.version;
  t.true(inst.version > 0);

  inst.set('lastName', 'Zelenetskiy');
  t.is(inst.version, ++version);
});

test("toJSON with nested models", t => {
  class FirstName extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: String,
          value: "Dmitry"
        }
      });
    }
  }

  class Author extends BaseModel {
    constructor() {
      super({
        firstName: {
          filter: (v) => FirstName.fromJSON(v)
        },
        lastName: {
          filter: String,
          value: "Zelenetskiy"
        }
      });
    }
  }

  const inst = new Author();
  const json = inst.toJSON();

  t.deepEqual(json, {lastName: "Zelenetskiy", firstName: {firstName: "Dmitry"}});
});
